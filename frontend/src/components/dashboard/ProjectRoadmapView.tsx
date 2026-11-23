import { useState, useMemo } from 'react';
import {
  AlertCircle,
  Sparkles,
  FolderGit2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Roadmap } from '../../services/roadmapApi';
import type { Project } from '../../services/projectsApi';
import { RoadmapCopilotDrawer } from './RoadmapCopilotDrawer';
import { RoadmapMetricsHeader } from './RoadmapMetricsHeader';
import { RoadmapPhaseCard } from './RoadmapPhaseCard';

interface ProjectRoadmapViewProps {
  roadmap: Roadmap | null;
  selectedProject: Project;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerateRoadmap: () => void;
  phaseViewMode: 'grid' | 'focused' | 'all';
  setPhaseViewMode: (mode: 'grid' | 'focused' | 'all') => void;
  activePhaseIndex: number;
  setActivePhaseIndex: React.Dispatch<React.SetStateAction<number>>;
  completedTaskIds: Record<number, boolean>;
  toggleTaskCompleted: (taskId: number) => void;
  expandedPhases: Record<number, boolean>;
  togglePhaseExpanded: (phaseId: number) => void;
  onRoadmapUpdated?: (updatedRoadmap: Roadmap, updatedProject?: Project) => void;
}

export function ProjectRoadmapView({
  roadmap,
  selectedProject,
  isLoading,
  isGenerating,
  error,
  onGenerateRoadmap,
  phaseViewMode,
  setPhaseViewMode,
  activePhaseIndex,
  setActivePhaseIndex,
  completedTaskIds,
  toggleTaskCompleted,
  expandedPhases,
  togglePhaseExpanded,
  onRoadmapUpdated,
}: ProjectRoadmapViewProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [openPhases, setOpenPhases] = useState<Record<number, boolean>>({});
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotPhaseId, setCopilotPhaseId] = useState<number | null>(null);

  const scrollToPhase = (phaseId: number) => {
    setTimeout(() => {
      const el = document.getElementById(`phase-accordion-${phaseId}`);
      if (el) {
        const container = el.closest('main') || document.querySelector('.overflow-y-auto') || window;
        if (container && 'scrollTo' in container && container !== window) {
          const c = container as HTMLElement;
          const containerRect = c.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const targetTop = c.scrollTop + (elRect.top - containerRect.top) - 16;
          c.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 120);
  };

  const togglePhase = (index: number, phaseId: number) => {
    setActivePhaseIndex(index);
    const willOpen = !openPhases[index];
    setOpenPhases((prev) => ({
      ...prev,
      [index]: willOpen,
    }));
    if (willOpen) {
      scrollToPhase(phaseId);
    }
  };

  const handleStepClick = (index: number, phaseId: number) => {
    setActivePhaseIndex(index);
    setOpenPhases((prev) => ({
      ...prev,
      [index]: true,
    }));
    if (phaseViewMode !== 'all') {
      setPhaseViewMode('all');
    }
    scrollToPhase(phaseId);
  };

  const handleExpandAll = () => {
    if (!roadmap) return;
    const allOpen: Record<number, boolean> = {};
    roadmap.phases.forEach((_, idx) => {
      allOpen[idx] = true;
    });
    setOpenPhases(allOpen);
  };

  const handleCollapseAll = () => {
    setOpenPhases({});
  };

  const allTasks = useMemo(() => {
    if (!roadmap) return [];
    return roadmap.phases.flatMap((p) => p.milestones.flatMap((m) => m.tasks));
  }, [roadmap]);

  const completedTasksCount = useMemo(() => {
    return allTasks.filter((t) => completedTaskIds[t.id]).length;
  }, [allTasks, completedTaskIds]);

  const progressPercent = useMemo(() => {
    if (allTasks.length === 0) return 0;
    return Math.round((completedTasksCount / allTasks.length) * 100);
  }, [allTasks.length, completedTasksCount]);

  const totalMilestones = useMemo(() => {
    if (!roadmap) return 0;
    return roadmap.phases.reduce((acc, p) => acc + p.milestones.length, 0);
  }, [roadmap]);

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
      {error && (
        <div
          className={`p-5 border flex items-center justify-between gap-4 ${isDark
            ? 'bg-rose-950/20 border-rose-900/60 text-rose-300'
            : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-9 h-9 border flex items-center justify-center shrink-0 ${isDark
                ? 'bg-rose-900/30 border-rose-800/40 text-rose-400'
                : 'bg-rose-100 border-rose-200 text-rose-600'
                }`}
            >
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-semibold text-sm ${isDark ? 'text-rose-200' : 'text-rose-950'}`}>
                AI Service Notice
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                {error}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGenerateRoadmap}
            className="px-4 py-2 bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors cursor-pointer shrink-0 text-xs shadow-xs"
          >
            Try Again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="p-20 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div
            className={`w-10 h-10 border-2 animate-spin mb-4 ${isDark
              ? 'border-[#242321] border-t-[#FFC900]'
              : 'border-[#E8E1D5] border-t-[#D9A300]'
              }`}
          />
          <p
            className={`text-sm font-medium ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
          >
            Loading saved development roadmap...
          </p>
        </div>
      ) : isGenerating ? (
        <div
          className={`border p-14 text-center flex flex-col items-center justify-center min-h-[400px] ${
            isDark ? 'border-[#242321] bg-[#111215]' : 'border-[#E8E1D5] bg-white'
          }`}
        >
          <div className="relative mb-6">
            <div
              className={`w-14 h-14 rounded-full border-2 animate-spin ${
                isDark
                  ? 'border-[#242321] border-t-[#FFC900] border-r-[#FFC900]/40'
                  : 'border-[#E8E1D5] border-t-[#D9A300] border-r-[#D9A300]/40'
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles
                className={`w-5 h-5 animate-pulse ${
                  isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                }`}
              />
            </div>
          </div>
          <h4
            className={`text-xl font-semibold mb-2 tracking-tight ${
              isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
            }`}
          >
            Generating Your Roadmap
          </h4>
          <p
            className={`text-xs font-medium max-w-xs leading-relaxed mb-6 ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            Structuring execution phases and milestones.
          </p>
          <div className="w-64 max-w-xs space-y-2">
            <div
              className={`h-1.5 w-full rounded-full overflow-hidden relative ${
                isDark ? 'bg-[#242321]' : 'bg-[#E8E1D5]'
              }`}
            >
              <div
                className={`h-full rounded-full ${
                  isDark
                    ? 'bg-gradient-to-r from-[#FFC900]/60 via-[#FFC900] to-[#FFC900]/60 shadow-[0_0_12px_rgba(255,201,0,0.5)]'
                    : 'bg-gradient-to-r from-[#D9A300]/60 via-[#D9A300] to-[#D9A300]/60 shadow-[0_0_12px_rgba(217,163,0,0.4)]'
                }`}
                style={{
                  width: '45%',
                  animation: 'indeterminate 1.8s ease-in-out infinite',
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-medium tracking-tight px-0.5">
              <span className={isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}>
                Architecting milestones...
              </span>
              <span className={isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}>
                AI Engine
              </span>
            </div>
          </div>
        </div>
      ) : roadmap ? (
        <div className="space-y-10">
          <RoadmapMetricsHeader
            roadmap={roadmap}
            selectedProject={selectedProject}
            totalMilestones={totalMilestones}
            allTasks={allTasks}
            completedTasksCount={completedTasksCount}
            progressPercent={progressPercent}
            setIsCopilotOpen={setIsCopilotOpen}
            setCopilotPhaseId={setCopilotPhaseId}
            phaseViewMode={phaseViewMode}
            setPhaseViewMode={setPhaseViewMode}
            activePhaseIndex={activePhaseIndex}
            expandedPhases={expandedPhases}
            togglePhaseExpanded={togglePhaseExpanded}
            completedTaskIds={completedTaskIds}
            toggleTaskCompleted={toggleTaskCompleted}
            handleStepClick={handleStepClick}
            isDark={isDark}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                  isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                }`}
              >
                Detailed Phase Execution Breakdown
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className={`px-3.5 py-1.5 border text-xs sm:text-sm font-semibold tracking-tight transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:border-[#FFC900]/50 hover:bg-[#18191D]'
                    : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:border-[#D9A300]/50 hover:bg-white'
                }`}
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className={`px-3.5 py-1.5 border text-xs sm:text-sm font-semibold tracking-tight transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:border-[#FFC900]/50 hover:bg-[#18191D]'
                    : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:border-[#D9A300]/50 hover:bg-white'
                }`}
              >
                Collapse All
              </button>
            </div>
          </div>

          <div
            className={`border-t ${
              isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
            }`}
          >
            {roadmap.phases.map((phase, pIdx) => (
              <RoadmapPhaseCard
                key={phase.id}
                phase={phase}
                pIdx={pIdx}
                openPhases={openPhases}
                    togglePhase={togglePhase}
                completedTaskIds={completedTaskIds}
                toggleTaskCompleted={toggleTaskCompleted}
                setIsCopilotOpen={setIsCopilotOpen}
                setCopilotPhaseId={setCopilotPhaseId}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`border p-14 text-center flex flex-col items-center justify-center min-h-[400px] ${isDark ? 'border-[#242321] bg-[#111215]' : 'border-[#E8E1D5] bg-white'
            }`}
        >
          <div
            className={`w-14 h-14 border flex items-center justify-center mb-5 ${isDark
              ? 'bg-[#08090B] border-[#242321] text-[#FFC900]'
              : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
              }`}
          >
            <FolderGit2 className="w-7 h-7" />
          </div>
          <h4
            className={`text-2xl font-bold mb-1.5 tracking-tight ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
          >
            No Roadmap Generated Yet
          </h4>
          <p
            className={`text-sm max-w-sm leading-relaxed mb-6 ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
          >
            Create a structured development roadmap with phases, milestones, and actionable tasks.
          </p>
          <button
            type="button"
            onClick={onGenerateRoadmap}
            className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold tracking-tight transition-all shadow-md cursor-pointer ${isDark
              ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
              : 'bg-[#D9A300] text-white hover:brightness-105'
              }`}
          >
            <span>Generate Roadmap</span>
          </button>
        </div>
      )}

      {roadmap && (
        <button
          type="button"
          onClick={() => {
            setCopilotPhaseId(null);
            setIsCopilotOpen(true);
          }}
          title="Roadmap AI Copilot"
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#FFC900] hover:bg-[#E5B500] text-black shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-black/15 group cursor-pointer"
        >
          <Sparkles className="w-6 h-6 transition-transform group-hover:rotate-12 text-black" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC900] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-black"></span>
          </span>
        </button>
      )}

      <RoadmapCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        roadmap={roadmap}
        selectedProject={selectedProject}
        activePhaseId={copilotPhaseId}
        completedTaskIds={completedTaskIds}
        onRoadmapUpdated={(updated, updatedProject) => {
          if (onRoadmapUpdated) {
            onRoadmapUpdated(updated, updatedProject);
          }
        }}
      />
    </div>
  );
}
