import {
  Calendar,
  Layers,
  Sparkles,
  Check,
  CheckCircle2,
  ListTodo,
  Minus,
  Plus,
} from 'lucide-react';
import type { RoadmapPhase } from '../../services/roadmapApi';

interface RoadmapPhaseCardProps {
  phase: RoadmapPhase;
  pIdx: number;
  openPhases: Record<number, boolean>;
  togglePhase: (index: number, phaseId: number) => void;
  completedTaskIds: Record<number, boolean>;
  toggleTaskCompleted: (taskId: number) => void;
  setIsCopilotOpen: (v: boolean) => void;
  setCopilotPhaseId: (id: number | null) => void;
  isDark: boolean;
}

export function RoadmapPhaseCard({
  phase,
  pIdx,
  openPhases,
  togglePhase,
  completedTaskIds,
  toggleTaskCompleted,
  setIsCopilotOpen,
  setCopilotPhaseId,
  isDark,
}: RoadmapPhaseCardProps) {
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

                    <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 pl-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCopilotPhaseId(phase.id);
                          setIsCopilotOpen(true);
                        }}
                        className={`text-xs font-semibold px-2.5 py-1.5 border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs ${
                          isDark
                            ? 'border-[#242321] hover:border-[#FFC900]/50 bg-[#141518] text-[#A6A4A0] hover:text-[#FFC900]'
                            : 'border-[#E8E1D5] hover:border-[#D9A300]/50 bg-white text-[#6B665E] hover:text-[#D9A300]'
                        }`}
                        title={`Ask Copilot about Phase 0${pIdx + 1}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FFC900]" />
                        <span className="hidden md:inline">Ask Copilot</span>
                      </button>
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
                                        className={`flex items-start gap-3 py-1.5 cursor-pointer transition-colors group ${isChecked
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
}
