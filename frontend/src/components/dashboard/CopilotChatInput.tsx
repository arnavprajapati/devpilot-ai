import { Layers, Loader2, Send, X } from 'lucide-react';
import type { Roadmap, RoadmapPhase } from '../../services/roadmapApi';

interface CopilotChatInputProps {
  roadmap: Roadmap | null;
  selectedScopePhaseId: number | null;
  setSelectedScopePhaseId: (id: number | null) => void;
  selectedScopePhase: RoadmapPhase | undefined;
  inputText: string;
  setInputText: (text: string) => void;
  isLoading: boolean;
  isDark: boolean;
  handleSendMessage: (textToSend?: string) => Promise<void>;
}

export function CopilotChatInput({
  roadmap,
  selectedScopePhaseId,
  setSelectedScopePhaseId,
  selectedScopePhase,
  inputText,
  setInputText,
  isLoading,
  isDark,
  handleSendMessage,
}: CopilotChatInputProps) {
  return (
        <div
          className={`p-3.5 sm:p-4 border-t ${
            isDark ? 'bg-[#0D0D0D] border-[#222222]' : 'bg-white border-[#E5E0D8]'
          }`}
        >
          {roadmap?.phases && roadmap.phases.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 text-xs scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedScopePhaseId(null)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
                  selectedScopePhaseId === null
                    ? 'bg-[#FFC900] text-black border-[#FFC900] shadow-sm font-semibold'
                    : isDark
                    ? 'bg-[#161616] border-[#2A2A2A] text-stone-400 hover:text-white hover:border-stone-600'
                    : 'bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Phases</span>
              </button>
              {roadmap.phases.map((p) => {
                const isSelected = selectedScopePhaseId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedScopePhaseId(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 max-w-[180px] sm:max-w-[220px] cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFC900] text-black border-[#FFC900] shadow-sm font-semibold'
                        : isDark
                        ? 'bg-[#161616] border-[#2A2A2A] text-stone-400 hover:text-white hover:border-stone-600'
                        : 'bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
                    }`}
                  >
                    <span className="font-mono text-[11px] opacity-75">0{p.order}</span>
                    <span className="truncate">{p.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                isDark
                  ? 'bg-[#161616] border-[#2E2E2E] focus-within:border-[#FFC900]'
                  : 'bg-gray-50 border-gray-300 focus-within:border-[#FFC900]'
              }`}
            >
              {selectedScopePhase ? (
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${
                    isDark
                      ? 'bg-[#222222] text-[#FFC900] border border-[#FFC900]/30'
                      : 'bg-[#FFF9E6] text-[#B28900] border border-[#FFC900]/40'
                  }`}
                >
                  <span className="font-semibold">Phase 0{selectedScopePhase.order}:</span>
                  <span className="max-w-[110px] sm:max-w-[170px] truncate">{selectedScopePhase.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedScopePhaseId(null);
                    }}
                    title="Switch to All Phases"
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-current transition-colors ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${
                    isDark ? 'bg-[#222222] text-stone-400' : 'bg-stone-200/70 text-stone-600'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>All Phases</span>
                </div>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedScopePhase
                    ? `Ask or instruct about Phase 0${selectedScopePhase.order} (e.g. "add image upload")...`
                    : "Ask AI to explain, add, edit, or remove phases..."
                }
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm sm:text-[15px] focus:outline-none min-w-0"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-3 cursor-pointer rounded-xl bg-[#FFC900] hover:bg-[#E5B500] text-black font-bold flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-[#FFC900] active:scale-95 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
  );
}
