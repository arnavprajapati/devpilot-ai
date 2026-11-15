import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import {
  LogOut,
  FolderGit2,
  Plus,
  X,
  AlertCircle,
  Layers,
  Sparkles,
  RotateCcw,
  Workflow,
} from 'lucide-react';
import { RoadmapWhiteboard } from '../components/whiteboard/RoadmapWhiteboard';
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
  const { user, logout } = useAuth();
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
  const [detailsTab, setDetailsTab] = useState<'roadmap' | 'whiteboard' | 'specs'>('roadmap');
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [phaseViewMode, setPhaseViewMode] = useState<'grid' | 'focused' | 'all'>('grid');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<number, boolean>>({});
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({});

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

      const initial: Record<number, boolean> = {};
      if (roadmap.phases[0]) {
        roadmap.phases[0].milestones.forEach((m) => {
          m.tasks.forEach((t) => {
            initial[t.id] = true;
          });
        });
      }
      setCompletedTaskIds(initial);
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
    const res = await roadmapApi.generateRoadmap(projectId);
    if (res.data?.roadmap) {
      setRoadmap(res.data.roadmap);
      setActivePhaseIndex(0);
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

  const handleLogout = async () => {
    await logout();
    onNavigate('landing');
  };

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
    setPhaseViewMode('focused');
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FF4055] text-white text-[11px] font-bold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            In Progress
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'Planning':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/80 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
    <div className="min-h-screen bg-zinc-50/60 flex flex-col select-none">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="focus:outline-none cursor-pointer"
            >
              <Logo size="md" />
            </button>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-900">
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-800">
                {user?.full_name || user?.email}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-500 hover:text-black transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <div className="inline-flex flex-col items-center group cursor-pointer select-none">
            <h1 className="text-4xl sm:text-5xl font-black italic tracking-tight bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent pb-1">
              Engineering Workspaces
            </h1>
            <span className="w-36 h-[3.5px] sm:h-[4px] rounded-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] mt-1 group-hover:w-full transition-all duration-300" />
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-3.5">
            Showing {projects.length} active software workspaces & execution roadmaps
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="inline-flex items-center p-1 bg-white border border-zinc-200/90 rounded-2xl shadow-2xs">
              {(['All', 'Planning', 'In Progress', 'Completed'] as const).map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-black text-white shadow-xs'
                        : 'text-zinc-600 hover:text-black'
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchProjects}
              className="text-xs font-bold underline hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-black animate-spin mb-4" />
            <p className="text-xs text-zinc-500 font-medium">Loading your projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 sm:p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-50 border border-zinc-200 text-zinc-900 flex items-center justify-center mb-4">
              <FolderGit2 className="w-8 h-8 text-[#FF4055]" />
            </div>
            <h3 className="text-lg font-bold text-zinc-950 mb-1">
              {statusFilter === 'All' ? 'No projects yet' : `No ${statusFilter} projects`}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mb-6 leading-relaxed">
              {statusFilter === 'All'
                ? 'Create your first software project to generate an AI architecture roadmap and whiteboard flowchart.'
                : `You do not have any projects currently in "${statusFilter}" state.`}
            </p>
            {statusFilter === 'All' && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden animate-in fade-in duration-200">
          <header className="h-20 shrink-0 border-b border-zinc-200 bg-white px-6 sm:px-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0">
                <FolderGit2 className="w-5 h-5 text-[#FF4055]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight line-clamp-1">
                    {selectedProject.name}
                  </h2>
                  {renderStatusBadge(selectedProject.status)}
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  Software workspace, architecture roadmap, and execution specifications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex p-1 bg-zinc-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDetailsTab('roadmap')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    detailsTab === 'roadmap'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4055]" />
                  <span>AI Roadmap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsTab('whiteboard')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    detailsTab === 'whiteboard'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <Workflow className="w-3.5 h-3.5 text-[#FF4055]" />
                  <span>Whiteboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsTab('specs')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    detailsTab === 'specs'
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Project Specs</span>
                </button>
              </div>

              {(detailsTab === 'roadmap' || detailsTab === 'whiteboard') && roadmap && !isGeneratingRoadmap && (
                <button
                  type="button"
                  onClick={() => setConfirmRegenerateOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#FF4055]" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              )}

              <button
                type="button"
                onClick={closeModal}
                className="p-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </header>

          <div
            className={`flex-1 ${
              detailsTab === 'whiteboard'
                ? 'w-full h-full flex flex-col overflow-hidden bg-white'
                : 'overflow-y-auto px-6 sm:px-12 py-8 bg-zinc-50/40'
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
                  <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center flex flex-col items-center justify-center my-auto mx-auto max-w-md shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 flex items-center justify-center mb-5">
                      <Workflow className="w-6 h-6 text-[#FF4055]" />
                    </div>
                    <h4 className="text-lg font-bold text-zinc-950 mb-1.5">No Roadmap Generated Yet</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                      Generate an AI roadmap first to view, edit, and reorganize the interactive
                      visual flowchart whiteboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsTab('roadmap');
                        handleGenerateRoadmap(selectedProject.id);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#FF4055]" />
                      <span>Generate Roadmap</span>
                    </button>
                  </div>
                )}
              </div>
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
