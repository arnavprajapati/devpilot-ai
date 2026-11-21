import { useState, useMemo } from 'react';
import {
  Code2,
  Calendar,
  Check,
  CheckCircle2,
  ListTodo,
  AlertCircle,
  FolderGit2,
  Layers,
  Plus,
  Minus,
  LayoutGrid,
  GitCommit,
  Rows3,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Project } from '../../services/projectsApi';
import type { Roadmap } from '../../services/roadmapApi';
import { RoadmapCopilotDrawer } from './RoadmapCopilotDrawer';

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
  onRoadmapUpdated?: (updatedRoadmap: Roadmap) => void;
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
          <div
            className={`border p-6 sm:p-8 relative ${isDark
              ? 'border-[#242321] bg-[#111215]'
              : 'border-[#E8E1D5] bg-[#FFFFFF]'
              }`}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
                }`}
            />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-inherit">
              <div className="space-y-2.5 max-w-2xl">
                <div
                  className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                    }`}
                >
                  Architecture & Execution Plan
                </div>
                <h3
                  className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                    }`}
                >
                  {roadmap.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 border text-sm font-medium ${isDark
                      ? 'bg-[#08090B] text-[#A6A4A0] border-[#242321]'
                      : 'bg-[#F7F3EA] text-[#6B665E] border-[#E8E1D5]'
                      }`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-[#FFC900]" />
                    <span>{selectedProject.tech_stack || 'Standard Web Stack'}</span>
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 border text-sm font-medium ${isDark
                      ? 'bg-[#08090B] text-[#A6A4A0] border-[#242321]'
                      : 'bg-[#F7F3EA] text-[#6B665E] border-[#E8E1D5]'
                      }`}
                  >
                    <ListTodo className="w-3.5 h-3.5 text-[#FFC900]" />
                    <span>{roadmap.phases.length} Phases • {totalMilestones} Milestones • {allTasks.length} Tasks</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0">
                <div className="text-right">
                  <div
                    className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                      }`}
                  >
                    Overall Progress
                  </div>
                  <div className="flex items-baseline gap-2 justify-end">
                    <span
                      className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                        }`}
                    >
                      {progressPercent}%
                    </span>
                    <span
                      className={`text-xs font-medium ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                        }`}
                    >
                      ({completedTasksCount}/{allTasks.length} Done)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`w-full h-1.5 overflow-hidden mt-5 ${isDark ? 'bg-[#242321]' : 'bg-[#E8E1D5]'
                }`}
            >
              <div
                className={`h-full transition-all duration-500 ${isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
                  }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-6 pt-5 border-t border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCopilotPhaseId(null);
                    setIsCopilotOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFC900] hover:bg-[#E5B500] text-black font-bold text-xs sm:text-sm tracking-tight border border-[#FFC900] shadow-sm transition-all cursor-pointer rounded active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Roadmap AI Copilot</span>
                </button>
              </div>

              <div
                className={`inline-flex items-center p-1 border self-start sm:self-auto ${isDark ? 'border-[#242321] bg-[#08090B]' : 'border-[#E8E1D5] bg-[#F7F3EA]/70'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setPhaseViewMode('all')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border text-sm font-semibold tracking-tight transition-all cursor-pointer ${phaseViewMode === 'all'
                    ? isDark
                      ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900] shadow-xs'
                      : 'bg-[#D9A300] text-white border-[#D9A300] shadow-xs'
                    : isDark
                      ? 'border-transparent text-[#A6A4A0] hover:text-[#F5F3EF]'
                      : 'border-transparent text-[#6B665E] hover:text-[#171717]'
                    }`}
                >
                  <Rows3 className="w-4 h-4" />
                  <span>All Phases</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhaseViewMode('focused')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border text-sm font-semibold tracking-tight transition-all cursor-pointer ${phaseViewMode === 'focused'
                    ? isDark
                      ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900] shadow-xs'
                      : 'bg-[#D9A300] text-white border-[#D9A300] shadow-xs'
                    : isDark
                      ? 'border-transparent text-[#A6A4A0] hover:text-[#F5F3EF]'
                      : 'border-transparent text-[#6B665E] hover:text-[#171717]'
                    }`}
                >
                  <GitCommit className="w-4 h-4" />
                  <span>Phase Stepper</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhaseViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border text-sm font-semibold tracking-tight transition-all cursor-pointer ${phaseViewMode === 'grid'
                    ? isDark
                      ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900] shadow-xs'
                      : 'bg-[#D9A300] text-white border-[#D9A300] shadow-xs'
                    : isDark
                      ? 'border-transparent text-[#A6A4A0] hover:text-[#F5F3EF]'
                      : 'border-transparent text-[#6B665E] hover:text-[#171717]'
                    }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Overview Grid</span>
                </button>
              </div>
            </div>

            {phaseViewMode === 'grid' && (
              <div className="mt-6 pt-5 border-t border-inherit">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {roadmap.phases.map((phase, pIdx) => {
                    const phaseTasks = phase.milestones.flatMap((m) => m.tasks);
                    const doneCount = phaseTasks.filter((t) => completedTaskIds[t.id]).length;
                    const isDone = phaseTasks.length > 0 && doneCount === phaseTasks.length;
                    const isInFlight = doneCount > 0 && !isDone;
                    const phasePercent =
                      phaseTasks.length > 0
                        ? Math.round((doneCount / phaseTasks.length) * 100)
                        : 0;
                    const isExpanded = !!expandedPhases[phase.id];
                    const visibleTasks = isExpanded ? phaseTasks : phaseTasks.slice(0, 3);
                    const remainingCount = phaseTasks.length - 3;
                    const isActive = activePhaseIndex === pIdx;

                    return (
                      <div
                        key={phase.id}
                        className={`border p-5 flex flex-col justify-between transition-all ${isActive
                          ? isDark
                            ? 'bg-[#18191D] border-[#FFC900] shadow-sm'
                            : 'bg-white border-[#D9A300] shadow-sm ring-1 ring-[#D9A300]/20'
                          : isDark
                            ? 'bg-[#08090B] border-[#242321] hover:border-[#FFC900]/40'
                            : 'bg-[#F7F3EA]/60 border-[#E8E1D5] hover:border-[#D9A300]/40 hover:bg-white'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-inherit">
                            <span
                              className={`text-xs sm:text-sm font-semibold uppercase tracking-wider px-2.5 py-0.5 border ${isDark
                                ? 'bg-[#18191D] text-[#A6A4A0] border-[#242321]'
                                : 'bg-white text-[#6B665E] border-[#E8E1D5]'
                                }`}
                            >
                              Phase 0{pIdx + 1}
                            </span>
                            {isDone ? (
                              <span className="text-xs sm:text-sm font-semibold px-2.5 py-0.5 border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                                Done
                              </span>
                            ) : isInFlight ? (
                              <span
                                className={`text-xs sm:text-sm font-semibold px-2.5 py-0.5 border ${isDark
                                  ? 'bg-[#FFC900]/20 text-[#FFC900] border-[#FFC900]/40'
                                  : 'bg-[#D9A300]/20 text-[#D9A300] border-[#D9A300]/40'
                                  }`}
                              >
                                In Flight
                              </span>
                            ) : (
                              <span
                                className={`text-xs sm:text-sm font-medium px-2.5 py-0.5 border ${isDark
                                  ? 'bg-[#18191D] text-[#A6A4A0] border-[#242321]'
                                  : 'bg-white text-[#6B665E] border-[#E8E1D5]'
                                  }`}
                              >
                                Queued
                              </span>
                            )}
                          </div>

                          <h5
                            className={`text-base font-semibold tracking-tight line-clamp-2 min-h-[48px] mb-1.5 leading-snug ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                              }`}
                          >
                            {phase.title}
                          </h5>

                          {phase.duration && (
                            <div
                              className={`text-sm font-medium mb-3.5 flex items-center gap-1.5 ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                }`}
                            >
                              <Calendar className="w-4 h-4 opacity-70" />
                              <span>{phase.duration}</span>
                            </div>
                          )}

                          <div className="space-y-2.5 mt-2.5 pt-3 border-t border-inherit">
                            {visibleTasks.map((task) => {
                              const isChecked = !!completedTaskIds[task.id];
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => toggleTaskCompleted(task.id)}
                                  className={`flex items-start gap-2.5 cursor-pointer select-none text-sm font-medium transition-colors group ${isChecked
                                    ? isDark
                                      ? 'text-[#A6A4A0]/60'
                                      : 'text-[#6B665E]/60'
                                    : isDark
                                      ? 'text-[#F5F3EF] hover:text-[#FFC900]'
                                      : 'text-[#171717] hover:text-[#D9A300]'
                                    }`}
                                >
                                  <div
                                    className={`mt-0.5 w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${isChecked
                                      ? isDark
                                        ? 'bg-[#FFC900] border-[#FFC900] text-[#08090B]'
                                        : 'bg-[#D9A300] border-[#D9A300] text-white'
                                      : isDark
                                        ? 'border-[#343330] bg-[#18191D] group-hover:border-[#FFC900]'
                                        : 'border-[#E8E1D5] bg-white group-hover:border-[#D9A300]'
                                      }`}
                                  >
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span
                                    className={`leading-snug line-clamp-2 ${isChecked ? 'line-through' : 'font-medium'
                                      }`}
                                  >
                                    {task.title}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {remainingCount > 0 && (
                            <button
                              type="button"
                              onClick={() => togglePhaseExpanded(phase.id)}
                              className={`text-sm font-semibold mt-3 pt-2.5 border-t border-inherit flex items-center justify-between w-full cursor-pointer transition-colors ${isDark
                                ? 'text-[#A6A4A0] hover:text-[#FFC900]'
                                : 'text-[#6B665E] hover:text-[#D9A300]'
                                }`}
                            >
                              <span>{isExpanded ? 'Show less' : `+ ${remainingCount} more tasks`}</span>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                  }`}
                              />
                            </button>
                          )}
                        </div>

                        <div className="pt-3.5 mt-3.5 border-t border-inherit">
                          <div className="flex items-center justify-between text-sm font-medium mb-2">
                            <span className={isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}>
                              {doneCount}/{phaseTasks.length} Tasks
                            </span>
                            <span
                              className={`font-semibold ${isDone
                                ? 'text-emerald-500'
                                : isDark
                                  ? 'text-[#FFC900]'
                                  : 'text-[#D9A300]'
                                }`}
                            >
                              {phasePercent}%
                            </span>
                          </div>
                          <div
                            className={`w-full h-1.5 overflow-hidden ${isDark ? 'bg-[#242321]' : 'bg-[#E8E1D5]'
                              }`}
                          >
                            <div
                              className={`h-full transition-all duration-300 ${isDone
                                ? 'bg-emerald-500'
                                : isDark
                                  ? 'bg-[#FFC900]'
                                  : 'bg-[#D9A300]'
                                }`}
                              style={{ width: `${phasePercent}%` }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStepClick(pIdx, phase.id)}
                            className={`w-full text-center py-2 mt-3 border text-sm font-semibold transition-colors cursor-pointer ${isDark
                              ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:border-[#FFC900]/50 hover:bg-[#18191D]'
                              : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:border-[#D9A300]/50 hover:bg-stone-50'
                              }`}
                          >
                            Inspect Phase Accordion →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {phaseViewMode === 'focused' && (
              <div className="mt-6 pt-5 border-t border-inherit">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {roadmap.phases.map((phase, pIdx) => {
                    const phaseTasks = phase.milestones.flatMap((m) => m.tasks);
                    const doneCount = phaseTasks.filter((t) => completedTaskIds[t.id]).length;
                    const isDone = phaseTasks.length > 0 && doneCount === phaseTasks.length;
                    const phasePercent =
                      phaseTasks.length > 0
                        ? Math.round((doneCount / phaseTasks.length) * 100)
                        : 0;
                    const isActive = activePhaseIndex === pIdx;

                    return (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => handleStepClick(pIdx, phase.id)}
                        className={`border p-5 text-left transition-all cursor-pointer flex flex-col justify-between group ${isActive
                          ? isDark
                            ? 'bg-[#18191D] border-[#FFC900] shadow-sm'
                            : 'bg-white border-[#D9A300] shadow-sm ring-1 ring-[#D9A300]/20'
                          : isDark
                            ? 'bg-[#08090B] border-[#242321] hover:border-[#FFC900]/50 hover:bg-[#18191D]/40'
                            : 'bg-[#F7F3EA]/60 border-[#E8E1D5] hover:border-[#D9A300]/50 hover:bg-white'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`px-2.5 py-0.5 text-xs sm:text-sm font-semibold uppercase tracking-wider border ${isDone
                                ? isDark
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isActive
                                  ? isDark
                                    ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900]'
                                    : 'bg-[#D9A300] text-white border-[#D9A300]'
                                  : isDark
                                    ? 'bg-[#18191D] text-[#A6A4A0] border-[#242321]'
                                    : 'bg-white text-[#6B665E] border-[#E8E1D5]'
                                }`}
                            >
                              Phase 0{pIdx + 1}
                            </span>
                            {phase.duration && (
                              <span
                                className={`text-sm font-medium ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                  }`}
                              >
                                {phase.duration}
                              </span>
                            )}
                          </div>

                          <h5
                            className={`text-base font-semibold tracking-tight line-clamp-1 mb-3 ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                              }`}
                          >
                            {phase.title}
                          </h5>

                          <div className="space-y-2 mb-4">
                            {phase.milestones.slice(0, 3).map((m) => {
                              const mTasks = m.tasks;
                              const mDone =
                                mTasks.length > 0 && mTasks.every((t) => completedTaskIds[t.id]);
                              return (
                                <div
                                  key={m.id}
                                  className={`text-sm font-medium flex items-center gap-2.5 truncate ${mDone
                                    ? isDark
                                      ? 'text-emerald-400 font-medium'
                                      : 'text-emerald-700 font-medium'
                                    : isDark
                                      ? 'text-[#A6A4A0]'
                                      : 'text-[#6B665E]'
                                    }`}
                                >
                                  <span
                                    className={`w-2 h-2 shrink-0 ${mDone
                                      ? 'bg-emerald-500'
                                      : isDark
                                        ? 'bg-[#FFC900]'
                                        : 'bg-[#D9A300]'
                                      }`}
                                  />
                                  <span className="truncate">{m.title}</span>
                                </div>
                              );
                            })}
                            {phase.milestones.length > 3 && (
                              <span
                                className={`text-xs font-medium block pt-1 ${isDark ? 'text-[#A6A4A0]/70' : 'text-[#6B665E]/70'
                                  }`}
                              >
                                + {phase.milestones.length - 3} more deliverables
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-inherit">
                          <div className="flex items-center justify-between text-sm font-medium mb-2">
                            <span className={isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}>
                              {doneCount}/{phaseTasks.length} Tasks
                            </span>
                            <span
                              className={`font-semibold ${isDone
                                ? 'text-emerald-500'
                                : isDark
                                  ? 'text-[#FFC900]'
                                  : 'text-[#D9A300]'
                                }`}
                            >
                              {phasePercent}%
                            </span>
                          </div>
                          <div
                            className={`w-full h-1.5 overflow-hidden ${isDark ? 'bg-[#242321]' : 'bg-[#E8E1D5]'
                              }`}
                          >
                            <div
                              className={`h-full transition-all duration-300 ${isDone
                                ? 'bg-emerald-500'
                                : isDark
                                  ? 'bg-[#FFC900]'
                                  : 'bg-[#D9A300]'
                                }`}
                              style={{ width: `${phasePercent}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
            {roadmap.phases.map((phase, pIdx) => {
              const isOpen = !!openPhases[pIdx];
              const phaseTasks = phase.milestones.flatMap((m) => m.tasks);
              const doneCount = phaseTasks.filter((t) => completedTaskIds[t.id]).length;
              const isDone = phaseTasks.length > 0 && doneCount === phaseTasks.length;
              const phasePercent =
                phaseTasks.length > 0
                  ? Math.round((doneCount / phaseTasks.length) * 100)
                  : 0;

              return (
                <div
                  key={phase.id}
                  id={`phase-accordion-${phase.id}`}
                  className={`scroll-mt-6 border-b transition-colors ${
                    isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => togglePhase(pIdx, phase.id)}
                    className={`w-full py-6 sm:py-8 px-2 sm:px-4 flex items-center justify-between text-left cursor-pointer transition-colors group active:scale-[0.99] ${
                      isOpen
                        ? isDark
                          ? 'bg-[#111215]/60'
                          : 'bg-[#F7F3EA]/50'
                        : isDark
                        ? 'hover:bg-[#111215]/30'
                        : 'hover:bg-[#F7F3EA]/30'
                    }`}
                  >
                    <div className="flex items-center gap-6 sm:gap-10 min-w-0">
                      <span
                        className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight shrink-0 transition-colors ${
                          isOpen
                            ? isDark
                              ? 'text-[#FFC900]'
                              : 'text-[#D9A300]'
                            : isDark
                            ? 'text-[#F5F3EF] group-hover:text-[#FFC900]'
                            : 'text-[#171717] group-hover:text-[#D9A300]'
                        }`}
                      >
                        0{pIdx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          {phase.duration && (
                            <span
                              className={`text-sm font-normal uppercase tracking-wider ${
                                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                              }`}
                            >
                              {phase.duration}
                            </span>
                          )}
                          {isDone && (
                            <span className="flex items-center gap-1 text-sm text-emerald-500 font-semibold tracking-wider">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>COMPLETED</span>
                            </span>
                          )}
                        </div>
                        <h4
                          className={`text-xl sm:text-2xl font-bold tracking-tight truncate ${
                            isOpen
                              ? isDark
                                ? 'text-[#F5F3EF]'
                                : 'text-[#171717]'
                              : isDark
                              ? 'text-[#A6A4A0] group-hover:text-[#F5F3EF]'
                              : 'text-[#6B665E] group-hover:text-[#171717]'
                          }`}
                        >
                          {phase.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 pl-4">
                      <span
                        className={`hidden sm:inline-block text-sm font-normal px-2.5 py-1 border ${
                          isDark
                            ? 'border-[#242321] text-[#A6A4A0]'
                            : 'border-[#E8E1D5] text-[#6B665E]'
                        }`}
                      >
                        {doneCount}/{phaseTasks.length} Done ({phasePercent}%)
                      </span>
                      <div
                        className={`w-10 h-10 border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                          isOpen
                            ? isDark
                              ? 'border-[#FFC900] bg-[#FFC900] text-[#08090B]'
                              : 'border-[#D9A300] bg-[#D9A300] text-white'
                            : isDark
                            ? 'border-[#343330] text-[#A6A4A0] group-hover:border-[#FFC900] group-hover:text-[#FFC900]'
                            : 'border-stone-300 text-[#6B665E] group-hover:border-[#D9A300] group-hover:text-[#D9A300]'
                        }`}
                      >
                        {isOpen ? (
                          <Minus className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                      }`}
                  >
                    <div className="pt-2 pb-10 px-2 sm:px-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6 self-start">
                          <div
                            className={`border p-6 ${isDark
                              ? 'border-[#242321] bg-[#111215]'
                              : 'border-[#E8E1D5] bg-white'
                              }`}
                          >
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-inherit">
                              <span
                                className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                                  }`}
                              >
                                Phase 0{pIdx + 1} Spec
                              </span>
                              {phase.duration && (
                                <span
                                  className={`text-sm font-normal flex items-center gap-1 ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                    }`}
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{phase.duration}</span>
                                </span>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <div
                                  className={`text-sm font-normal uppercase tracking-wider ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                    }`}
                                >
                                  Scope Progress
                                </div>
                                <div className="flex items-baseline justify-between mt-1">
                                  <span
                                    className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                                      }`}
                                  >
                                    {phasePercent}%
                                  </span>
                                  <span
                                    className={`text-sm font-normal ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                      }`}
                                  >
                                    {doneCount} of {phaseTasks.length} tasks
                                  </span>
                                </div>
                                <div
                                  className={`w-full h-1.5 overflow-hidden mt-2 ${isDark ? 'bg-[#242321]' : 'bg-[#E8E1D5]'
                                    }`}
                                >
                                  <div
                                    className={`h-full transition-all duration-300 ${isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
                                      }`}
                                    style={{ width: `${phasePercent}%` }}
                                  />
                                </div>
                              </div>

                              <div className="pt-3 border-t border-inherit space-y-2.5">
                                <div
                                  className={`text-sm font-normal uppercase tracking-wider ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                    }`}
                                >
                                  Deliverables Breakdown
                                </div>
                                <div
                                  className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                                    }`}
                                >
                                  <Layers className="w-4 h-4 text-[#FFC900]" />
                                  <span>{phase.milestones.length} Engineering Milestones</span>
                                </div>
                                <div
                                  className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                                    }`}
                                >
                                  <ListTodo className="w-4 h-4 text-[#FFC900]" />
                                  <span>{phaseTasks.length} Actionable Checklist Items</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCopilotPhaseId(phase.id);
                                    setIsCopilotOpen(true);
                                  }}
                                  className={`w-full mt-3 py-2 px-3 rounded border text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                                    isDark
                                      ? 'bg-[#FFC900]/10 hover:bg-[#FFC900]/20 border-[#FFC900]/30 text-[#FFC900]'
                                      : 'bg-[#FFC900]/15 hover:bg-[#FFC900]/25 border-[#FFC900]/50 text-black'
                                  }`}
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#FFC900]" />
                                  <span>Ask Copilot about Phase 0{pIdx + 1}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-8 space-y-8 pl-0 lg:pl-2">
                          {phase.description && (
                            <p
                              className={`text-base sm:text-lg leading-relaxed font-normal ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                                }`}
                            >
                              {phase.description}
                            </p>
                          )}

                          <div className="space-y-6">
                            {phase.milestones.map((milestone) => (
                              <div key={milestone.id} className="space-y-3">
                                <div
                                  className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <CheckCircle2
                                      className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                                        }`}
                                    />
                                    <span
                                      className={`text-base font-semibold tracking-tight ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                                        }`}
                                    >
                                      {milestone.title}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-sm font-normal ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                      }`}
                                  >
                                    {milestone.tasks.length} tasks
                                  </span>
                                </div>

                                <ul className="space-y-2 pt-1">
                                  {milestone.tasks.map((task) => {
                                    const isChecked = !!completedTaskIds[task.id];
                                    return (
                                      <li
                                        key={task.id}
                                        onClick={() => toggleTaskCompleted(task.id)}
                                        className={`flex items-start gap-3 py-1.5 cursor-pointer select-none transition-colors group ${isChecked
                                          ? isDark
                                            ? 'text-[#A6A4A0]/60'
                                            : 'text-stone-400'
                                          : isDark
                                            ? 'text-[#F5F3EF] hover:text-[#FFC900]'
                                            : 'text-[#171717] hover:text-[#D9A300]'
                                          }`}
                                      >
                                        <div
                                          className={`mt-1 w-4 h-4 border flex items-center justify-center transition-all shrink-0 ${isChecked
                                            ? isDark
                                              ? 'bg-[#FFC900] border-[#FFC900] text-[#08090B]'
                                              : 'bg-[#D9A300] border-[#D9A300] text-white'
                                            : isDark
                                              ? 'border-[#343330] bg-transparent group-hover:border-[#FFC900]'
                                              : 'border-stone-400 bg-transparent group-hover:border-[#D9A300]'
                                            }`}
                                        >
                                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <span
                                            className={`text-sm sm:text-base font-normal leading-relaxed ${isChecked ? 'line-through' : ''
                                              }`}
                                          >
                                            {task.title}
                                          </span>
                                          {task.description && (
                                            <p
                                              className={`text-sm mt-0.5 leading-relaxed font-normal ${isChecked
                                                ? isDark
                                                  ? 'text-[#A6A4A0]/40'
                                                  : 'text-stone-400'
                                                : isDark
                                                  ? 'text-[#A6A4A0]'
                                                  : 'text-[#6B665E]'
                                                }`}
                                            >
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
        onRoadmapUpdated={(updated) => {
          if (onRoadmapUpdated) {
            onRoadmapUpdated(updated);
          }
        }}
      />
    </div>
  );
}
