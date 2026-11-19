import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Navbar } from '../components/Navbar';
import {
  FolderGit2,
  Plus,
  X,
  AlertCircle,
  Layers,
  Sparkles,
  RotateCcw,
  Workflow,
  Database,
} from 'lucide-react';
import { RoadmapWhiteboard } from '../components/whiteboard/RoadmapWhiteboard';
import { DatabaseSchemaCanvas } from '../components/database-schema/DatabaseSchemaCanvas';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { ProjectFormModal } from '../components/dashboard/ProjectFormModal';
import { ProjectDeleteModal } from '../components/dashboard/ProjectDeleteModal';
import { RegenerateRoadmapModal } from '../components/dashboard/RegenerateRoadmapModal';
import { ProjectRoadmapView } from '../components/dashboard/ProjectRoadmapView';
import { ProjectSpecsView } from '../components/dashboard/ProjectSpecsView';
import { projectsApi } from '../services/projectsApi';
import type { Project, ProjectStatus, TechStacksResponse } from '../services/projectsApi';
import { roadmapApi } from '../services/roadmapApi';
import type { Roadmap } from '../services/roadmapApi';

interface DashboardViewProps {
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableTechStacks, setAvailableTechStacks] = useState<TechStacksResponse | null>(null);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'details' | 'delete' | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<ProjectStatus>('Planning');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');
  const filteredProjects = statusFilter === 'All' ? projects : projects.filter((p) => p.status === statusFilter);

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<'roadmap' | 'whiteboard' | 'database' | 'specs'>('roadmap');
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [phaseViewMode, setPhaseViewMode] = useState<'grid' | 'focused' | 'all'>('all');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<number, boolean>>({});
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({});
  const dbRegenerateRef = useRef<(() => void) | null>(null);
  const [isDatabaseGenerating, setIsDatabaseGenerating] = useState(false);

  const togglePhaseExpanded = (phaseId: number) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  useEffect(() => {
    if (selectedProject?.id && roadmap) {
      try {
        const stored = localStorage.getItem(`devpilot_tasks_${selectedProject.id}`);
        if (stored) {
          setCompletedTaskIds(JSON.parse(stored));
          return;
        }
      } catch (_) {}

      setCompletedTaskIds({});
    }
  }, [selectedProject?.id, roadmap?.id]);

  const toggleTaskCompleted = (taskId: number) => {
    setCompletedTaskIds((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      if (selectedProject?.id) {
        try {
          localStorage.setItem(`devpilot_tasks_${selectedProject.id}`, JSON.stringify(next));
        } catch (_) {}
      }
      return next;
    });
  };

  const fetchRoadmap = async (projectId: number) => {
    setIsRoadmapLoading(true);
    setRoadmapError(null);
    const res = await roadmapApi.getRoadmap(projectId);
    if (res.data?.exists && res.data.roadmap) {
      setRoadmap(res.data.roadmap);
    } else {
      setRoadmap(null);
    }
    setIsRoadmapLoading(false);
  };

  const handleGenerateRoadmap = async (projectId: number) => {
    setIsGeneratingRoadmap(true);
    setRoadmapError(null);
    setConfirmRegenerateOpen(false);
    try {
      localStorage.removeItem(`devpilot_tasks_${projectId}`);
    } catch (_) {}
    setCompletedTaskIds({});
    const res = await roadmapApi.generateRoadmap(projectId);
    if (res.data?.roadmap) {
      setRoadmap(res.data.roadmap);
      setActivePhaseIndex(0);
      setCompletedTaskIds({});
    } else {
      const rawError =
        typeof res.error === 'object' && res.error?.error
          ? String(res.error.error)
          : typeof res.error === 'string'
          ? res.error
          : '';

      const lower = rawError.toLowerCase();
      let friendlyMsg = 'AI Roadmap generation is temporarily unavailable. Please try again in a moment.';
      if (
        !lower.includes('gemini') &&
        !lower.includes('api') &&
        !lower.includes('key') &&
        !lower.includes('env') &&
        !lower.includes('traceback') &&
        !lower.includes('502') &&
        rawError.length > 0 &&
        rawError.length < 120
      ) {
        friendlyMsg = rawError;
      }
      setRoadmapError(friendlyMsg);
    }
    setIsGeneratingRoadmap(false);
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    const res = await projectsApi.list();
    if (res.data) {
      setProjects(res.data);
    } else {
      setError(typeof res.error === 'string' ? res.error : 'Failed to load projects.');
    }
    setIsLoading(false);
  };

  const fetchTechStacks = async () => {
    const res = await projectsApi.getTechStacks();
    if (res.data) {
      setAvailableTechStacks(res.data);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTechStacks();
  }, []);

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setFormRequirements('');
    setSelectedTechs([]);
    setFormStatus('Planning');
    setFormError(null);
    setModalMode('create');
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormName(project.name);
    setFormDescription(project.description);
    setFormRequirements(project.requirements || '');
    const techs = project.tech_stack
      ? project.tech_stack.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    setSelectedTechs(techs);
    setFormStatus(project.status);
    setFormError(null);
    setModalMode('edit');
  };

  const openDetailsModal = (project: Project) => {
    setSelectedProject(project);
    setModalMode('details');
    setDetailsTab('roadmap');
    setActivePhaseIndex(0);
    setPhaseViewMode('all');
    fetchRoadmap(project.id);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setModalMode('delete');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedProject(null);
    setFormError(null);
    setRoadmap(null);
    setRoadmapError(null);
    setConfirmRegenerateOpen(false);
  };

  const addTechTag = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed) return;
    if (!selectedTechs.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedTechs((prev) => [...prev, trimmed]);
    }
  };

  const removeTechTag = (techToRemove: string) => {
    setSelectedTechs((prev) => prev.filter((t) => t !== techToRemove));
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Project name is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Project description is required.');
      return;
    }

    setIsSubmitting(true);
    const res = await projectsApi.create({
      name: formName.trim(),
      description: formDescription.trim(),
      requirements: formRequirements.trim(),
      tech_stack: selectedTechs.join(', '),
      status: formStatus,
    });
    setIsSubmitting(false);

    if (res.data) {
      setProjects((prev) => [res.data!, ...prev]);
      closeModal();
    } else {
      setFormError(
        typeof res.error === 'object' && res.error?.name
          ? res.error.name[0]
          : res.error || 'Failed to create project.'
      );
    }
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Project name is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Project description is required.');
      return;
    }

    setIsSubmitting(true);
    const res = await projectsApi.update(selectedProject.id, {
      name: formName.trim(),
      description: formDescription.trim(),
      requirements: formRequirements.trim(),
      tech_stack: selectedTechs.join(', '),
      status: formStatus,
    });
    setIsSubmitting(false);

    if (res.data) {
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? res.data! : p))
      );
      if (selectedProject?.id === res.data.id) {
        setSelectedProject(res.data);
      }
      closeModal();
    } else {
      setFormError(
        typeof res.error === 'object' && res.error?.name
          ? res.error.name[0]
          : res.error || 'Failed to update project.'
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    const res = await projectsApi.delete(selectedProject.id);
    setIsSubmitting(false);

    if (res.status === 204 || !res.error) {
      setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id));
      closeModal();
    } else {
      setFormError('Failed to delete project. Please try again.');
    }
  };

  const handleStatusChange = async (projectId: number, newStatus: ProjectStatus) => {
    const res = await projectsApi.patchStatus(projectId, newStatus);
    if (res.data) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? res.data! : p))
      );
      if (selectedProject?.id === projectId) {
        setSelectedProject(res.data);
      }
    }
  };

  const renderStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'In Progress':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border text-xs font-semibold ${
              isDark
                ? 'bg-[#FFC900]/10 text-[#FFC900] border-[#FFC900]/30 shadow-[0_0_12px_rgba(255,201,0,0.1)]'
                : 'bg-[#D9A300]/10 text-[#B38300] border-[#D9A300]/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'}`} />
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border text-xs font-semibold ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'Planning':
      default:
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border text-xs font-medium ${
              isDark
                ? 'bg-white/5 text-[#A6A4A0] border-white/10'
                : 'bg-black/5 text-[#6B665E] border-[#E8E1D5]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#A6A4A0]' : 'bg-[#6B665E]'}`} />
            Planning
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col select-none transition-colors duration-300 relative overflow-hidden ${
        isDark ? 'bg-[#08090B] text-[#F5F3EF]' : 'bg-[#F7F3EA] text-[#171717]'
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-[position:80%_top] sm:bg-[position:75%_top] md:bg-[position:70%_top] lg:bg-center pointer-events-none transition-all duration-500 z-0 opacity-80"
        style={{ backgroundImage: `url('${isDark ? '/bg-dark.png' : '/bg-light.png'}')` }}
      />
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-300 z-0 ${
          isDark
            ? 'bg-gradient-to-b from-transparent via-[#08090B]/80 to-[#08090B]'
            : 'bg-gradient-to-b from-transparent via-[#F7F3EA]/80 to-[#F7F3EA]'
        }`}
      />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#FFC900]/10 via-[#FF8A1C]/5 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      <Navbar onNavigate={onNavigate} currentView="dashboard" />

      <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 relative z-10">
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <div className="inline-flex flex-col items-center select-none">
            <span
              className={`text-[11px] sm:text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${
                isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
              }`}
            >
              <span>MANAGEMENT</span>
              <span>•</span>
              <span>WORKSPACE</span>
              <span>•</span>
              <span>PIPELINE</span>
            </span>
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              Engineering{' '}
              <span className={isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}>
                Workspaces
              </span>
              .
            </h1>
            <span
              className={`w-28 sm:w-36 h-[3px] rounded-full mt-2 ${
                isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
              }`}
            />
          </div>
          <p
            className={`text-xs sm:text-base font-medium mt-3.5 ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            Showing {projects.length} active software workspaces & execution roadmaps
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div
              className={`inline-flex items-center p-1.5 rounded-full border shadow-xs ${
                isDark
                  ? 'bg-[#18191D]/90 border-[#343330] backdrop-blur-md'
                  : 'bg-[#FFFFFF]/90 border-[#E8E1D5] backdrop-blur-md'
              }`}
            >
              {(['All', 'Planning', 'In Progress', 'Completed'] as const).map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#FFC900] text-[#08090B] shadow-sm shadow-[#FFC900]/20'
                          : 'bg-[#D9A300] text-white shadow-sm'
                        : isDark
                        ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                        : 'text-[#6B665E] hover:text-[#171717]'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer shadow-md ${
                isDark
                  ? 'bg-gradient-to-r from-[#FFC900] to-[#E5A800] text-[#08090B] hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,201,0,0.35)]'
                  : 'bg-gradient-to-r from-[#D9A300] to-[#B88700] text-white hover:brightness-105'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between mb-6 ${
              isDark
                ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchProjects}
              className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div
              className={`w-8 h-8 rounded-full border-2 animate-spin mb-4 ${
                isDark
                  ? 'border-[#242321] border-t-[#FFC900]'
                  : 'border-[#E8E1D5] border-t-[#D9A300]'
              }`}
            />
            <p
              className={`text-xs font-medium ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              Loading your projects...
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div
            className={`rounded-3xl border border-dashed p-12 sm:p-16 text-center flex flex-col items-center justify-center ${
              isDark
                ? 'border-[#242321] bg-[#18191D]'
                : 'border-[#E8E1D5] bg-[#FFFFFF]'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-3xl border flex items-center justify-center mb-4 ${
                isDark
                  ? 'bg-[#08090B] border-[#242321] text-[#FFC900]'
                  : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
              }`}
            >
              <FolderGit2 className="w-8 h-8" />
            </div>
            <h3
              className={`text-lg font-bold mb-1 ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              {statusFilter === 'All' ? 'No projects yet' : `No ${statusFilter} projects`}
            </h3>
            <p
              className={`text-xs sm:text-sm font-semibold max-w-sm mb-8 leading-relaxed ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              {statusFilter === 'All'
                ? 'Create your first software project to generate an AI architecture roadmap and whiteboard flowchart.'
                : `You do not have any projects currently in "${statusFilter}" state.`}
            </p>
            {statusFilter === 'All' && (
              <button
                type="button"
                onClick={openCreateModal}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                  isDark
                    ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                    : 'bg-[#D9A300] text-white hover:brightness-105'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onView={openDetailsModal}
                formatDate={formatDate}
                renderStatusBadge={renderStatusBadge}
              />
            ))}
          </div>
        )}
      </main>

      <ProjectFormModal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        formName={formName}
        setFormName={setFormName}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formRequirements={formRequirements}
        setFormRequirements={setFormRequirements}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        selectedTechs={selectedTechs}
        addTechTag={addTechTag}
        removeTechTag={removeTechTag}
        availableTechStacks={availableTechStacks}
        formError={formError}
        isSubmitting={isSubmitting}
        onSubmit={modalMode === 'create' ? handleCreateSubmit : handleEditSubmit}
        onClose={closeModal}
      />

      {modalMode === 'details' && selectedProject && (
        <div
          className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-in fade-in duration-200 ${
            isDark ? 'bg-[#08090B] text-[#F5F3EF]' : 'bg-[#F7F3EA] text-[#171717]'
          }`}
        >
          <header
            className={`h-16 sm:h-18 shrink-0 border-b px-5 sm:px-8 flex items-center justify-between font-['Plus_Jakarta_Sans',sans-serif] ${
              isDark
                ? 'bg-[#08090B] border-[#242321]'
                : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                    : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                }`}
              >
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h2
                    className={`text-base sm:text-lg font-bold tracking-tight truncate ${
                      isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                    }`}
                  >
                    {selectedProject.name}
                  </h2>
                  {renderStatusBadge(selectedProject.status)}
                </div>
                <p
                  className={`text-xs mt-0.5 truncate font-normal ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  Software workspace, architecture roadmap, and execution specifications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                className={`inline-flex p-0.5 rounded-xl border ${
                  isDark
                    ? 'bg-[#18191D] border-[#242321]'
                    : 'bg-[#F7F3EA] border-[#E8E1D5]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDetailsTab('roadmap')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    detailsTab === 'roadmap'
                      ? isDark
                        ? 'bg-[#FFC900] text-[#08090B]'
                        : 'bg-[#D9A300] text-white'
                      : isDark
                      ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                      : 'text-[#6B665E] hover:text-[#171717]'
                  }`}
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      detailsTab === 'roadmap'
                        ? isDark
                          ? 'text-[#08090B]'
                          : 'text-white'
                        : isDark
                        ? 'text-[#FFC900]'
                        : 'text-[#D9A300]'
                    }`}
                  />
                  <span>AI Roadmap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsTab('whiteboard')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    detailsTab === 'whiteboard'
                      ? isDark
                        ? 'bg-[#FFC900] text-[#08090B]'
                        : 'bg-[#D9A300] text-white'
                      : isDark
                      ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                      : 'text-[#6B665E] hover:text-[#171717]'
                  }`}
                >
                  <Workflow
                    className={`w-3.5 h-3.5 ${
                      detailsTab === 'whiteboard'
                        ? isDark
                          ? 'text-[#08090B]'
                          : 'text-white'
                        : isDark
                        ? 'text-[#FFC900]'
                        : 'text-[#D9A300]'
                    }`}
                  />
                  <span>Whiteboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsTab('database')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    detailsTab === 'database'
                      ? isDark
                        ? 'bg-[#FFC900] text-[#08090B]'
                        : 'bg-[#D9A300] text-white'
                      : isDark
                      ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                      : 'text-[#6B665E] hover:text-[#171717]'
                  }`}
                >
                  <Database
                    className={`w-3.5 h-3.5 ${
                      detailsTab === 'database'
                        ? isDark
                          ? 'text-[#08090B]'
                          : 'text-white'
                        : isDark
                        ? 'text-[#FFC900]'
                        : 'text-[#D9A300]'
                    }`}
                  />
                  <span>Database Schema</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsTab('specs')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    detailsTab === 'specs'
                      ? isDark
                        ? 'bg-[#FFC900] text-[#08090B]'
                        : 'bg-[#D9A300] text-white'
                      : isDark
                      ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                      : 'text-[#6B665E] hover:text-[#171717]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Project Specs</span>
                </button>
              </div>

              {detailsTab === 'database' ? (
                <button
                  type="button"
                  onClick={() => dbRegenerateRef.current?.()}
                  disabled={isDatabaseGenerating}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-tight transition-all cursor-pointer disabled:opacity-50 ${
                    isDark
                      ? 'border-[#242321] bg-[#18191D] text-[#F5F3EF] hover:border-[#FFC900]/50'
                      : 'border-[#E8E1D5] bg-[#FFFFFF] text-[#171717] hover:border-[#D9A300]/50'
                  }`}
                >
                  <RotateCcw
                    className={`w-3.5 h-3.5 ${
                      isDatabaseGenerating
                        ? 'animate-spin text-[#FFC900]'
                        : isDark
                        ? 'text-[#FFC900]'
                        : 'text-[#D9A300]'
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {isDatabaseGenerating ? 'Architecting...' : 'Regenerate'}
                  </span>
                </button>
              ) : (detailsTab === 'roadmap' || detailsTab === 'whiteboard') && roadmap && !isGeneratingRoadmap && (
                <button
                  type="button"
                  onClick={() => setConfirmRegenerateOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isDark
                      ? 'border-[#242321] bg-[#18191D] text-[#F5F3EF] hover:border-[#FFC900]/50'
                      : 'border-[#E8E1D5] bg-[#FFFFFF] text-[#171717] hover:border-[#D9A300]/50'
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}`} />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              )}

              <button
                type="button"
                onClick={closeModal}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold tracking-tight ${
                  isDark
                    ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:border-[#FFC900]/50 bg-[#18191D]'
                    : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:border-[#D9A300]/50 bg-white'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </header>

          <div
            className={`flex-1 ${
              detailsTab === 'whiteboard' || detailsTab === 'database'
                ? `w-full h-full flex flex-col overflow-hidden ${isDark ? 'bg-[#08090B]' : 'bg-[#FFFFFF]'}`
                : `overflow-y-auto no-scrollbar px-6 sm:px-12 py-8 ${isDark ? 'bg-[#08090B]' : 'bg-[#F7F3EA]'}`
            }`}
          >
            {detailsTab === 'roadmap' ? (
              <ProjectRoadmapView
                roadmap={roadmap}
                selectedProject={selectedProject}
                isLoading={isRoadmapLoading}
                isGenerating={isGeneratingRoadmap}
                error={roadmapError}
                onGenerateRoadmap={() => handleGenerateRoadmap(selectedProject.id)}
                phaseViewMode={phaseViewMode}
                setPhaseViewMode={setPhaseViewMode}
                activePhaseIndex={activePhaseIndex}
                setActivePhaseIndex={setActivePhaseIndex}
                completedTaskIds={completedTaskIds}
                toggleTaskCompleted={toggleTaskCompleted}
                expandedPhases={expandedPhases}
                togglePhaseExpanded={togglePhaseExpanded}
              />
            ) : detailsTab === 'whiteboard' ? (
              <div className="w-full flex-1 flex flex-col min-h-[640px]">
                {roadmap ? (
                  <RoadmapWhiteboard projectId={selectedProject.id} roadmap={roadmap} />
                ) : (
                  <div
                    className={`rounded-3xl border border-dashed p-12 text-center flex flex-col items-center justify-center my-auto mx-auto max-w-md shadow-xs ${
                      isDark
                        ? 'border-[#242321] bg-[#18191D]'
                        : 'border-[#E8E1D5] bg-[#FFFFFF]'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${
                        isDark
                          ? 'bg-[#08090B] border-[#242321] text-[#FFC900]'
                          : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                      }`}
                    >
                      <Workflow className="w-6 h-6" />
                    </div>
                    <h4
                      className={`text-lg font-bold mb-1.5 ${
                        isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                      }`}
                    >
                      No Roadmap Generated Yet
                    </h4>
                    <p
                      className={`text-xs leading-relaxed mb-6 ${
                        isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                      }`}
                    >
                      Generate an AI roadmap first to view, edit, and reorganize the interactive
                      visual flowchart whiteboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsTab('roadmap');
                        handleGenerateRoadmap(selectedProject.id);
                      }}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer ${
                        isDark
                          ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                          : 'bg-[#D9A300] text-white hover:brightness-105'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Roadmap</span>
                    </button>
                  </div>
                )}
              </div>
            ) : detailsTab === 'database' ? (
              <DatabaseSchemaCanvas
                project={selectedProject}
                onRegisterRegenerate={(fn) => {
                  dbRegenerateRef.current = fn;
                }}
                onGeneratingChange={setIsDatabaseGenerating}
              />
            ) : (
              <ProjectSpecsView
                project={selectedProject}
                formatDate={formatDate}
                onStatusChange={(newStatus) => handleStatusChange(selectedProject.id, newStatus)}
                onEdit={() => openEditModal(selectedProject)}
                onDelete={() => openDeleteModal(selectedProject)}
              />
            )}
          </div>
        </div>
      )}

      <RegenerateRoadmapModal
        isOpen={confirmRegenerateOpen && !!selectedProject}
        hasCustomizedWhiteboard={!!roadmap?.has_customized_whiteboard}
        onClose={() => setConfirmRegenerateOpen(false)}
        onConfirm={() => selectedProject && handleGenerateRoadmap(selectedProject.id)}
      />

      <ProjectDeleteModal
        isOpen={modalMode === 'delete' && !!selectedProject}
        project={selectedProject}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
