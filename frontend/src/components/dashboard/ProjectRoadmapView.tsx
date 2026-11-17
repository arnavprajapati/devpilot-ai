import { useMemo } from 'react';
import {
  Code2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Layers,
  ListTodo,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';
import type { Project } from '../../services/projectsApi';
import type { Roadmap } from '../../services/roadmapApi';

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
}: ProjectRoadmapViewProps) {
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
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/90 text-rose-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-rose-950 text-xs">AI Service Notice</p>
              <p className="text-rose-700 text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGenerateRoadmap}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors cursor-pointer shrink-0 text-xs shadow-2xs"
          >
            Try Again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center min-h-[360px]">
          <div className="w-9 h-9 rounded-full border-2 border-zinc-300 border-t-black animate-spin mb-4" />
          <p className="text-xs text-zinc-500 font-medium">
            Loading saved development roadmap...
          </p>
        </div>
      ) : isGenerating ? (
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div className="w-9 h-9 rounded-full border-2 border-zinc-300 border-t-black animate-spin mb-4" />
          <h4 className="text-lg font-extrabold text-zinc-950 mb-2">
            Architecting Development Roadmap
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
            Decomposing requirements, mapping dependencies, and generating actionable engineering phases and tasks...
          </p>
          <div className="w-48 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] w-1/2 animate-pulse" />
          </div>
        </div>
      ) : roadmap ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4055] to-[#FF8A1C]" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Generated Architecture & Plan
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                  {roadmap.title}
                </h4>
                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    Tech Stack: <strong className="text-zinc-700 font-semibold">{selectedProject.tech_stack || 'Standard Web Stack'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-5">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-zinc-500 mb-0.5">Overall Progress</div>
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent leading-none py-1">
                    {progressPercent}%
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 whitespace-nowrap">
                    {completedTasksCount} of {allTasks.length} tasks done
                  </div>
                </div>

                <div className="inline-flex p-1 bg-zinc-100 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setPhaseViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      phaseViewMode === 'grid'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    Overview Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhaseViewMode('focused')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      phaseViewMode === 'focused'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    Stepper
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhaseViewMode('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      phaseViewMode === 'all'
                        ? 'bg-white text-black shadow-xs'
                        : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden my-6">
              <div
                className="h-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-xs">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#FF4055] animate-pulse" />
                <span>Click tasks to track real-time progress.</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200/60">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  {roadmap.phases.length} Phases
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {totalMilestones} Milestones
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200/60">
                  <ListTodo className="w-3.5 h-3.5 text-[#FF4055]" />
                  {allTasks.length} Actionable Tasks
                </span>
              </div>
            </div>

            {phaseViewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {roadmap.phases.map((phase, pIdx) => {
                  const phaseTasks = phase.milestones.flatMap((m) => m.tasks);
                  const doneCount = phaseTasks.filter((t) => completedTaskIds[t.id]).length;
                  const isDone = phaseTasks.length > 0 && doneCount === phaseTasks.length;
                  const isInFlight = doneCount > 0 && !isDone;
                  const isExpanded = !!expandedPhases[phase.id];
                  const visibleTasks = isExpanded ? phaseTasks : phaseTasks.slice(0, 3);
                  const remainingCount = phaseTasks.length - 3;

                  return (
                    <div
                      key={phase.id}
                      className="border border-zinc-200/90 rounded-2xl p-4 bg-zinc-50/50 flex flex-col justify-between hover:bg-white hover:border-zinc-300 transition-all shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-200/60">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                            Phase 0{pIdx + 1}
                          </span>
                          {isDone ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black text-white">
                              Done
                            </span>
                          ) : isInFlight ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] text-white">
                              In Flight
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-200/80 text-zinc-700">
                              Queued
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-zinc-950 mb-1 leading-snug line-clamp-2 min-h-[32px]">
                          {phase.title}
                        </div>

                        {phase.duration && (
                          <div className="text-[10px] font-medium text-zinc-400 mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>{phase.duration}</span>
                          </div>
                        )}

                        <div className="space-y-2 mt-3 pt-2.5 border-t border-zinc-200/60">
                          {visibleTasks.map((task) => {
                            const isChecked = !!completedTaskIds[task.id];
                            return (
                              <div
                                key={task.id}
                                onClick={() => toggleTaskCompleted(task.id)}
                                className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-zinc-700 hover:text-black transition-colors group"
                              >
                                <div
                                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                    isChecked
                                      ? 'bg-black border-black text-white'
                                      : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span
                                  className={`leading-snug line-clamp-2 ${
                                    isChecked ? 'line-through text-zinc-400' : 'text-zinc-800'
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
                            className="text-[11px] font-bold text-zinc-500 hover:text-black mt-2 pt-2 border-t border-zinc-200/40 flex items-center justify-between w-full cursor-pointer transition-colors"
                          >
                            <span>{isExpanded ? 'Show less' : `+ ${remainingCount} more tasks`}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : phaseViewMode === 'focused' ? (
              <div className="space-y-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 bg-zinc-100/70 rounded-2xl border border-zinc-200/80">
                  {roadmap.phases.map((phase, pIdx) => {
                    const isActive = activePhaseIndex === pIdx;
                    const taskCount = phase.milestones.reduce(
                      (acc, m) => acc + m.tasks.length,
                      0
                    );
                    return (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => setActivePhaseIndex(pIdx)}
                        className={`flex flex-col text-left p-3.5 rounded-xl transition-all cursor-pointer relative ${
                          isActive
                            ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200/80 ring-1 ring-black/5'
                            : 'text-zinc-600 hover:text-black hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-black text-white'
                                : 'bg-zinc-200/70 text-zinc-700'
                            }`}
                          >
                            Phase 0{pIdx + 1}
                          </span>
                          {phase.duration && (
                            <span className="text-[10px] font-semibold text-zinc-400 truncate">
                              {phase.duration}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold line-clamp-1 text-zinc-900 mt-0.5">
                          {phase.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 font-medium">
                          {phase.milestones.length} Deliverables • {taskCount} Tasks
                        </div>
                        {isActive && (
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const currentPhase =
                    roadmap.phases[activePhaseIndex] || roadmap.phases[0];
                  if (!currentPhase) return null;

                  return (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-black text-white text-sm font-black flex items-center justify-center shrink-0">
                              0{activePhaseIndex + 1}
                            </span>
                            <div>
                              <h5 className="text-base font-bold text-zinc-950">
                                {currentPhase.title}
                              </h5>
                              {currentPhase.description && (
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {currentPhase.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {currentPhase.duration && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-700 self-start sm:self-auto shrink-0 border border-zinc-200/80">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{currentPhase.duration}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {currentPhase.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                              <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-[#FF4055] shrink-0 mt-0.5" />
                                <div>
                                  <h6 className="text-xs sm:text-sm font-bold text-zinc-950">
                                    {milestone.title}
                                  </h6>
                                  {milestone.description && (
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                      {milestone.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-zinc-100 text-[11px] font-bold text-zinc-600 shrink-0">
                                {milestone.tasks.length} Tasks
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {milestone.tasks.map((task) => {
                                const isChecked = !!completedTaskIds[task.id];
                                return (
                                  <div
                                    key={task.id}
                                    onClick={() => toggleTaskCompleted(task.id)}
                                    className="p-3.5 rounded-xl border border-zinc-200/70 bg-zinc-50/40 hover:bg-white hover:border-zinc-300 transition-all shadow-2xs flex items-start gap-3 cursor-pointer select-none group"
                                  >
                                    <div
                                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                        isChecked
                                          ? 'bg-black border-black text-white'
                                          : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                                      }`}
                                    >
                                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={`text-xs font-bold ${
                                          isChecked ? 'line-through text-zinc-400' : 'text-zinc-900'
                                        }`}
                                      >
                                        {task.title}
                                      </div>
                                      {task.description && (
                                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                        <button
                          type="button"
                          disabled={activePhaseIndex === 0}
                          onClick={() =>
                            setActivePhaseIndex((prev) => Math.max(0, prev - 1))
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous Phase</span>
                        </button>

                        <span className="text-xs font-bold text-zinc-500">
                          Phase {activePhaseIndex + 1} of {roadmap.phases.length}
                        </span>

                        <button
                          type="button"
                          disabled={activePhaseIndex >= roadmap.phases.length - 1}
                          onClick={() =>
                            setActivePhaseIndex((prev) =>
                              Math.min(roadmap.phases.length - 1, prev + 1)
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Next Phase</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-6 mb-6">
                {roadmap.phases.map((phase, pIdx) => (
                  <div
                    key={phase.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/60">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-black text-white text-xs font-black flex items-center justify-center shrink-0">
                          0{pIdx + 1}
                        </span>
                        <div>
                          <h5 className="text-base font-bold text-zinc-950">
                            {phase.title}
                          </h5>
                          {phase.description && (
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {phase.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {phase.duration && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[11px] font-bold text-zinc-700 self-start sm:self-auto shrink-0 border border-zinc-200">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{phase.duration}</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {phase.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="rounded-xl border border-zinc-200/80 bg-white p-4 space-y-3 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-[#FF4055] shrink-0 mt-0.5" />
                              <div>
                                <h6 className="text-xs sm:text-sm font-bold text-zinc-900">
                                  {milestone.title}
                                </h6>
                                {milestone.description && (
                                  <p className="text-xs text-zinc-500 mt-0.5">
                                    {milestone.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-zinc-100 text-[11px] font-bold text-zinc-600 shrink-0">
                              {milestone.tasks.length} Tasks
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {milestone.tasks.map((task) => {
                              const isChecked = !!completedTaskIds[task.id];
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => toggleTaskCompleted(task.id)}
                                  className="p-3.5 rounded-xl border border-zinc-200/80 bg-white flex items-start gap-3 hover:border-zinc-300 transition-colors shadow-2xs cursor-pointer select-none group"
                                >
                                  <div
                                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                      isChecked
                                        ? 'bg-black border-black text-white'
                                        : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-xs font-bold ${
                                        isChecked ? 'line-through text-zinc-400' : 'text-zinc-900'
                                      }`}
                                    >
                                      {task.title}
                                    </div>
                                    {task.description && (
                                      <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
          <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 flex items-center justify-center mb-5">
            <FolderGit2 className="w-6 h-6 text-[#FF4055]" />
          </div>
          <h4 className="text-lg font-bold text-zinc-950 mb-1">
            No Roadmap Generated Yet
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
            Create a structured development roadmap with phases, milestones, and actionable tasks.
          </p>
          <button
            type="button"
            onClick={onGenerateRoadmap}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
          >
            <span>Generate Roadmap</span>
          </button>
        </div>
      )}
    </div>
  );
}
