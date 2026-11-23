import type { RefObject } from 'react';
import { Sparkles, Send, Bot, User, Link2 } from 'lucide-react';
import { type ChatMessage } from './EditEntityModal';

interface EditEntityPromptTabProps {
  chatMessages: ChatMessage[];
  isAiGenerating: boolean;
  aiPrompt: string;
  setAiPrompt: (p: string) => void;
  handleGenerateFromAi: (override?: string) => void;
  chatEndRef: RefObject<HTMLDivElement | null>;
  isDark: boolean;
  isDoc: boolean;
  renderFormattedMessage: (text: string, isDark: boolean, isUser?: boolean) => React.ReactNode;
}

export function EditEntityPromptTab({
  chatMessages,
  isAiGenerating,
  aiPrompt,
  setAiPrompt,
  handleGenerateFromAi,
  chatEndRef,
  isDark,
  isDoc,
  renderFormattedMessage,
}: EditEntityPromptTabProps) {
  return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                      : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                  }`}
                >
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4
                    className={`text-base sm:text-lg font-bold tracking-tight ${
                      isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                    }`}
                  >
                    Schema AI Copilot
                  </h4>
                  <p
                    className={`text-sm sm:text-[15px] leading-relaxed ${
                      isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                    }`}
                  >
                    Describe any schema changes, add new columns, or ask to create and link new tables.
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                    isDark
                      ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0]'
                      : 'bg-[#FAF8F5] border-[#E8E1D5] text-[#6B665E]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI Copilot • Real-time</span>
                </span>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isDark
                          ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                          : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`space-y-3 ${
                      msg.sender === 'user'
                        ? 'max-w-[85%]'
                        : 'max-w-[92%] sm:max-w-[90%] flex-1'
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm sm:text-[15px] leading-relaxed font-medium shadow-xs ${
                        msg.sender === 'user'
                          ? isDark
                            ? 'bg-[#FFC900] text-[#08090B] rounded-tr-xs'
                            : 'bg-[#D9A300] text-white rounded-tr-xs'
                          : isDark
                          ? 'bg-[#18191D] border border-[#242321] text-[#F5F3EF] rounded-tl-xs'
                          : 'bg-[#FAF8F5] border border-[#E8E1D5] text-[#171717] rounded-tl-xs'
                      }`}
                    >
                      {renderFormattedMessage(msg.text, isDark, msg.sender === 'user')}
                    </div>

                    {msg.generatedResult && (
                      <div
                        className={`p-4 rounded-2xl border space-y-3 ${
                          isDark
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-emerald-300 bg-emerald-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5
                              className={`text-sm sm:text-base font-bold ${
                                isDark ? 'text-emerald-400' : 'text-emerald-800'
                              }`}
                            >
                              {msg.generatedResult.name}
                            </h5>
                            {msg.generatedResult.description && (
                              <p
                                className={`text-xs sm:text-sm mt-0.5 ${
                                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                }`}
                              >
                                {msg.generatedResult.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500">
                            {msg.generatedResult.columns.length} fields
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
                          {msg.generatedResult.columns.map((c, idx) => (
                            <div
                              key={idx}
                              className={`px-3 py-2 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition-colors ${
                                isDark
                                  ? 'border-[#242321] bg-[#18191D]'
                                  : 'border-[#E8E1D5] bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {c.is_primary && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                    PK
                                  </span>
                                )}
                                {c.is_foreign && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                    FK
                                  </span>
                                )}
                                <span className="font-mono font-medium text-xs sm:text-sm">
                                  {c.name}
                                </span>
                              </div>
                              <span className="font-mono text-xs sm:text-sm text-emerald-500 font-semibold">
                                {c.data_type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.newEntities && msg.newEntities.length > 0 && (
                      <div className="space-y-3">
                        <span
                          className={`text-xs sm:text-sm font-bold uppercase tracking-wider block ${
                            isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                          }`}
                        >
                          ✨ New Connected {isDoc ? 'Collection' : 'Table'}:
                        </span>
                        {msg.newEntities.map((newEnt, nIdx) => (
                          <div
                            key={nIdx}
                            className={`p-4 rounded-2xl border space-y-3 ${
                              isDark
                                ? 'border-amber-500/30 bg-amber-500/5'
                                : 'border-amber-300 bg-amber-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5
                                  className={`text-sm sm:text-base font-bold ${
                                    isDark ? 'text-amber-400' : 'text-amber-800'
                                  }`}
                                >
                                  {newEnt.name}
                                </h5>
                                {newEnt.description && (
                                  <p
                                    className={`text-xs sm:text-sm mt-0.5 ${
                                      isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                    }`}
                                  >
                                    {newEnt.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                Auto-connect
                              </span>
                            </div>

                            <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                              {newEnt.columns.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className={`px-3 py-2 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
                                    isDark
                                      ? 'border-[#242321] bg-[#18191D]'
                                      : 'border-[#E8E1D5] bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
                                    {c.is_foreign && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                        FK
                                      </span>
                                    )}
                                    <span>{c.name}</span>
                                  </div>
                                  <span className="font-mono text-xs sm:text-sm opacity-75">
                                    {c.data_type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.relationships && msg.relationships.length > 0 && (
                      <div
                        className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                          isDark
                            ? 'border-sky-500/30 bg-sky-500/5'
                            : 'border-sky-300 bg-sky-50/50'
                        }`}
                      >
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isDark ? 'text-sky-400' : 'text-sky-700'
                          }`}
                        >
                          🔗 Auto-Connection Links:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.relationships.map((rel, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono"
                            >
                              <Link2 className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {rel.source_table} ──({rel.relationship_type || '1:N'}{rel.foreign_key_column ? ` via ${rel.foreign_key_column}` : ''})──&gt; {rel.target_table}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isDark
                          ? 'bg-[#FFC900]/20 border-[#FFC900]/40 text-[#FFC900]'
                          : 'bg-[#D9A300]/20 border-[#D9A300]/40 text-[#D9A300]'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isAiGenerating && (
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                      : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                  }`}
                >
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl rounded-tl-xs border text-xs sm:text-sm flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#A6A4A0]'
                      : 'bg-[#FAF8F5] border-[#E8E1D5] text-[#6B665E]'
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>AI is architecting schema...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div
            className={`p-3.5 border-t space-y-2 shrink-0 ${
              isDark ? 'border-[#242321] bg-[#141518]' : 'border-[#E8E1D5] bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateFromAi();
                  }
                }}
                placeholder={
                  isDoc
                    ? 'Ask AI to create, update, or connect tables…'
                    : 'Ask AI to create, update, or connect tables…'
                }
                className={`w-full p-3 rounded-xl border text-sm sm:text-[15px] leading-relaxed resize-none focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#08090B] border-[#242321] text-[#F5F3EF] focus:border-[#FFC900]'
                    : 'bg-white border-[#E8E1D5] text-[#171717] focus:border-[#D9A300]'
                }`}
              />
              <button
                type="button"
                onClick={() => handleGenerateFromAi()}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className={`p-3 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                  isDark
                    ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                    : 'bg-[#D9A300] text-white hover:brightness-105'
                }`}
                title="Send to AI (Enter)"
              >
                {isAiGenerating ? (
                  <div className="w-5 h-5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] px-1 opacity-70">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>DevPilot Intelligence</span>
            </div>
          </div>
        </div>
  );
}
