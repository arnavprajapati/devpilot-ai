import {
  Layers,
  Cpu,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Trash2,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import type { Project } from '../../services/projectsApi';
import type { RoadmapCopilotResponse } from '../../services/roadmapApi';

interface CopilotActionProposalCardProps {
  copilot: RoadmapCopilotResponse;
  msgId: string;
  selectedProject: Project;
  isApplied: boolean;
  isApplying: boolean;
  rejectedActionIds: Record<string, boolean>;
  isDark: boolean;
  handleApplyAction: (msgId: string, copilotRes: RoadmapCopilotResponse) => void;
  handleRejectAction: (msgId: string) => void;
}

export function CopilotActionProposalCard({
  copilot,
  msgId,
  selectedProject,
  isApplied,
  isApplying,
  rejectedActionIds,
  isDark,
  handleApplyAction,
  handleRejectAction,
}: CopilotActionProposalCardProps) {
  return (
    <>
                  {copilot && copilot.action === 'update_tech_stack' && (
                    <div
                      className={`p-4 rounded-xl border text-sm space-y-3.5 shadow-xs ${
                        isDark
                          ? 'bg-[#141416] border-amber-900/60 text-stone-200'
                          : 'bg-white border-amber-200 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${
                            isDark
                              ? 'bg-amber-950/70 border-amber-700/60 text-amber-300'
                              : 'bg-amber-50 border-amber-300 text-amber-800'
                          }`}
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          Tech Stack Change Proposal
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-lg border text-xs space-y-2 ${
                          isDark ? 'bg-black/40 border-stone-800' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                              Current Tech Stack
                            </span>
                            <span className="font-mono text-xs font-medium truncate block mt-0.5">
                              {selectedProject.tech_stack || 'Standard Stack'}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#FFC900] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              Proposed Tech Stack
                            </span>
                            <span className="font-mono text-xs font-semibold text-emerald-400 truncate block mt-0.5">
                              {copilot.new_tech_stack || 'Optimized Stack'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {copilot.change_summary && (
                        <div className={`text-xs leading-relaxed p-2.5 rounded-lg border ${
                          isDark ? 'bg-stone-900/50 border-stone-800 text-stone-300' : 'bg-stone-100/70 border-stone-200 text-stone-800'
                        }`}>
                          <span className="font-semibold block mb-1 text-[11px] uppercase tracking-wide text-[#FFC900]">Migration Overview</span>
                          {copilot.change_summary}
                        </div>
                      )}

                      {copilot.impact_on_completed_tasks && (
                        <div className={`p-2.5 rounded-lg border flex items-start gap-2 text-xs ${
                          isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <span className="font-semibold block text-[11px] uppercase tracking-wide">Impact on Completed Tasks</span>
                            <span>{copilot.impact_on_completed_tasks}</span>
                          </div>
                        </div>
                      )}

                      {copilot.affected_phases && copilot.affected_phases.length > 0 && (
                        <div className={`space-y-1.5 pt-2 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                          <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            Revised Phases ({copilot.affected_phases.length})
                          </span>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {copilot.affected_phases.map((p, pIdx) => {
                              const taskCount = (p.milestones || []).reduce((acc: number, m: any) => acc + (m.tasks?.length || 0), 0);
                              return (
                                <div
                                  key={pIdx}
                                  className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                    isDark ? 'bg-black/30 border-stone-800' : 'bg-stone-50/70 border-stone-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-[#FFC900]">0{p.order || pIdx + 1}</span>
                                    <span className="font-medium truncate max-w-[240px]">{p.title}</span>
                                  </div>
                                  <span className={`text-[11px] font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                    {p.duration || '2 Wks'} • {taskCount} tasks
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-end gap-2">
                        {isApplied ? (
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Applied to Project & Roadmap
                          </div>
                        ) : rejectedActionIds[msgId] ? (
                          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                            isDark ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}>
                            Proposal Dismissed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectAction(msgId)}
                              disabled={isApplying}
                              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                                isDark ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApplyAction(msgId, copilot)}
                              disabled={isApplying}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFC900] hover:bg-[#E5B500] text-black font-semibold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {isApplying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              Accept & Update Stack
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {copilot && copilot.action === 'update_roadmap' && (
                    <div
                      className={`p-4 rounded-xl border text-sm space-y-3.5 shadow-xs ${
                        isDark
                          ? 'bg-[#141416] border-emerald-900/60 text-stone-200'
                          : 'bg-white border-emerald-200 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${
                            isDark
                              ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Roadmap Architecture Revision
                        </span>
                      </div>

                      {copilot.change_summary && (
                        <div className={`text-xs leading-relaxed p-2.5 rounded-lg border ${
                          isDark ? 'bg-stone-900/50 border-stone-800 text-stone-300' : 'bg-stone-100/70 border-stone-200 text-stone-800'
                        }`}>
                          <span className="font-semibold block mb-1 text-[11px] uppercase tracking-wide text-[#FFC900]">Proposed Changes</span>
                          {copilot.change_summary}
                        </div>
                      )}

                      {copilot.impact_on_completed_tasks && (
                        <div className={`p-2.5 rounded-lg border flex items-start gap-2 text-xs ${
                          isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <span className="font-semibold block text-[11px] uppercase tracking-wide">Impact on Completed Tasks</span>
                            <span>{copilot.impact_on_completed_tasks}</span>
                          </div>
                        </div>
                      )}

                      {copilot.affected_phases && copilot.affected_phases.length > 0 && (
                        <div className={`space-y-1.5 pt-2 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                          <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            Updated Phases ({copilot.affected_phases.length})
                          </span>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {copilot.affected_phases.map((p, pIdx) => {
                              const taskCount = (p.milestones || []).reduce((acc: number, m: any) => acc + (m.tasks?.length || 0), 0);
                              return (
                                <div
                                  key={pIdx}
                                  className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                    isDark ? 'bg-black/30 border-stone-800' : 'bg-stone-50/70 border-stone-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-[#FFC900]">0{p.order || pIdx + 1}</span>
                                    <span className="font-medium truncate max-w-[240px]">{p.title}</span>
                                  </div>
                                  <span className={`text-[11px] font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                    {p.duration || '2 Wks'} • {taskCount} tasks
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-end gap-2">
                        {isApplied ? (
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Applied to Roadmap
                          </div>
                        ) : rejectedActionIds[msgId] ? (
                          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                            isDark ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}>
                            Proposal Dismissed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectAction(msgId)}
                              disabled={isApplying}
                              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                                isDark ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApplyAction(msgId, copilot)}
                              disabled={isApplying}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFC900] hover:bg-[#E5B500] text-black font-semibold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {isApplying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              Accept & Apply Changes
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {copilot && (copilot.action === 'add_phase' || copilot.action === 'edit_phase') && copilot.phase_data && (
                    <div
                      className={`p-4 rounded-xl border text-sm space-y-3 shadow-xs ${
                        isDark
                          ? 'bg-[#141416] border-emerald-900/60 text-stone-200'
                          : 'bg-white border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                              copilot.action === 'add_phase'
                                ? isDark
                                  ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : isDark
                                ? 'bg-amber-950/70 border-amber-700/60 text-amber-300'
                                : 'bg-amber-50 border-amber-300 text-amber-800'
                            }`}
                          >
                            {copilot.action === 'add_phase'
                              ? '+ New Phase Proposal'
                              : copilot.target_phase_order
                              ? `Update Phase 0${copilot.target_phase_order}`
                              : 'Phase Update'}
                          </span>
                          <span className={`text-xs font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            {copilot.phase_data.duration || '2 Weeks'}
                          </span>
                        </div>
                      </div>

                      {copilot.change_summary && (
                        <div className={`text-xs leading-relaxed p-2.5 rounded-lg border ${
                          isDark ? 'bg-stone-900/50 border-stone-800 text-stone-300' : 'bg-stone-100/70 border-stone-200 text-stone-800'
                        }`}>
                          <span className="font-semibold block mb-0.5 text-[11px] uppercase tracking-wide text-[#FFC900]">Summary</span>
                          {copilot.change_summary}
                        </div>
                      )}

                      {copilot.impact_on_completed_tasks && (
                        <div className={`p-2.5 rounded-lg border flex items-start gap-2 text-xs ${
                          isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <span className="font-semibold block text-[11px] uppercase tracking-wide">Impact on Completed Tasks</span>
                            <span>{copilot.impact_on_completed_tasks}</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4
                          className={`font-semibold text-sm tracking-tight ${
                            isDark ? 'text-stone-100' : 'text-stone-900'
                          }`}
                        >
                          {copilot.phase_data.title}
                        </h4>
                        {copilot.phase_data.description && (
                          <p
                            className={`text-xs mt-1 leading-relaxed font-normal ${
                              isDark ? 'text-stone-400' : 'text-stone-600'
                            }`}
                          >
                            {copilot.phase_data.description}
                          </p>
                        )}
                      </div>

                      {copilot.phase_data.milestones && copilot.phase_data.milestones.length > 0 && (
                        <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                          <div className={`text-xs font-medium flex items-center justify-between ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            <span>Milestones & Action Items ({copilot.phase_data.milestones.length})</span>
                          </div>
                          <div className="space-y-2">
                            {copilot.phase_data.milestones.map((m, mIdx) => (
                              <div
                                key={mIdx}
                                className={`p-3 rounded-lg border text-xs ${
                                  isDark
                                    ? 'bg-black/30 border-stone-800'
                                    : 'bg-stone-50/70 border-stone-200'
                                }`}
                              >
                                <div
                                  className={`font-semibold flex items-center gap-1.5 ${
                                    isDark ? 'text-stone-200' : 'text-stone-900'
                                  }`}
                                >
                                  <Layers className="w-3.5 h-3.5 text-[#FFC900]" />
                                  {m.title}
                                </div>
                                {m.description && (
                                  <p className={`text-[11px] mt-0.5 ml-5 font-normal ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                                    {m.description}
                                  </p>
                                )}
                                {m.tasks && m.tasks.length > 0 && (
                                  <ul className="mt-2 space-y-1.5 pl-4">
                                    {m.tasks.map((t, tIdx) => (
                                      <li
                                        key={tIdx}
                                        className={`list-disc text-xs leading-normal ${
                                          isDark ? 'text-stone-300' : 'text-stone-800'
                                        }`}
                                      >
                                        <span className="font-medium">{t.title}</span>
                                        {t.description && (
                                          <span className={`block text-[11px] font-normal mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                                            {t.description}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-end gap-2">
                        {isApplied ? (
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Applied to Roadmap
                          </div>
                        ) : rejectedActionIds[msgId] ? (
                          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                            isDark ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}>
                            Proposal Dismissed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectAction(msgId)}
                              disabled={isApplying}
                              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                                isDark ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApplyAction(msgId, copilot)}
                              disabled={isApplying}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFC900] hover:bg-[#E5B500] text-black font-semibold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {isApplying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              Apply to Roadmap
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {copilot && copilot.action === 'delete_phase' && (
                    <div
                      className={`p-4 rounded-xl border text-xs sm:text-sm space-y-3 shadow-sm ${
                        isDark
                          ? 'bg-[#181111] border-rose-900/60 text-stone-200'
                          : 'bg-rose-50/80 border-rose-200 text-stone-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded font-base font-bold text-[10px] uppercase tracking-wide bg-rose-950/70 border border-rose-700/60 text-rose-300">
                          Phase Removal Proposal
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                        {copilot.target_phase_order
                          ? `Phase ${copilot.target_phase_order} will be deleted and subsequent phases will be re-sequenced.`
                          : 'The selected phase will be permanently deleted.'}
                      </p>
                      <div className="pt-1 flex items-center justify-end gap-2">
                        {isApplied ? (
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3.5 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Phase Removed
                          </div>
                        ) : rejectedActionIds[msgId] ? (
                          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                            isDark ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}>
                            Proposal Dismissed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectAction(msgId)}
                              disabled={isApplying}
                              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                                isDark ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleApplyAction(msgId, copilot)}
                              disabled={isApplying}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {isApplying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Confirm Removal
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

    </>
  );
}
