import {
  Code2,
  ListTodo,
  Sparkles,
  Rows3,
  LayoutGrid,
  Check,
  Calendar,
  GitCommit,
  ChevronDown,
} from 'lucide-react';
import type { Roadmap, RoadmapTask } from '../../services/roadmapApi';
import type { Project } from '../../services/projectsApi';

interface RoadmapMetricsHeaderProps {
  roadmap: Roadmap;
  selectedProject: Project;
  totalMilestones: number;
  allTasks: RoadmapTask[];
  completedTasksCount: number;
  progressPercent: number;
  setIsCopilotOpen: (v: boolean) => void;
  setCopilotPhaseId: (id: number | null) => void;
  phaseViewMode: 'all' | 'focused' | 'grid';
  setPhaseViewMode: (m: 'all' | 'focused' | 'grid') => void;
  activePhaseIndex: number | null;
  expandedPhases: Record<number, boolean>;
  togglePhaseExpanded: (idx: number) => void;
  completedTaskIds: Record<number, boolean>;
  toggleTaskCompleted: (taskId: number) => void;
  handleStepClick: (index: number, phaseId: number) => void;
  isDark: boolean;
}

export function RoadmapMetricsHeader({
  roadmap,
  selectedProject,
  totalMilestones,
  allTasks,
  completedTasksCount,
  progressPercent,
  setIsCopilotOpen,
  setCopilotPhaseId,
  phaseViewMode,
  setPhaseViewMode,
  activePhaseIndex,
  expandedPhases,
  togglePhaseExpanded,
  completedTaskIds,
  toggleTaskCompleted,
  handleStepClick,
  isDark,
}: RoadmapMetricsHeaderProps) {
  return (
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
                                  className={`flex items-start gap-2.5 cursor-pointer text-sm font-medium transition-colors group ${isChecked
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
  );
}
