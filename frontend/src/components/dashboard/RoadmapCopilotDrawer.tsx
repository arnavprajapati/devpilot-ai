import { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Project } from '../../services/projectsApi';
import type { Roadmap, RoadmapCopilotResponse } from '../../services/roadmapApi';
import { roadmapApi } from '../../services/roadmapApi';
import { renderFormattedMessage } from './CopilotMessageFormatter';
import { CopilotActionProposalCard } from './CopilotActionProposalCard';
import { CopilotChatInput } from './CopilotChatInput';

export interface RoadmapChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  copilotResponse?: RoadmapCopilotResponse;
}

interface RoadmapCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap: Roadmap | null;
  selectedProject: Project;
  activePhaseId?: number | null;
  completedTaskIds?: Record<number, boolean>;
  onRoadmapUpdated: (updatedRoadmap: Roadmap, updatedProject?: Project) => void;
}

export function RoadmapCopilotDrawer({
  isOpen,
  onClose,
  roadmap,
  selectedProject,
  activePhaseId,
  completedTaskIds,
  onRoadmapUpdated,
}: RoadmapCopilotDrawerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState<RoadmapChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(null);
  const [appliedActionIds, setAppliedActionIds] = useState<Record<string, boolean>>({});
  const [rejectedActionIds, setRejectedActionIds] = useState<Record<string, boolean>>({});
  const [selectedScopePhaseId, setSelectedScopePhaseId] = useState<number | null>(activePhaseId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePhase = roadmap?.phases.find((p) => p.id === activePhaseId);
  const selectedScopePhase = roadmap?.phases.find((p) => p.id === selectedScopePhaseId);

  useEffect(() => {
    if (activePhaseId !== undefined) {
      setSelectedScopePhaseId(activePhaseId || null);
    }
  }, [activePhaseId]);

  useEffect(() => {
    if (selectedScopePhaseId && roadmap?.phases) {
      const exists = roadmap.phases.some((p) => p.id === selectedScopePhaseId);
      if (!exists) {
        setSelectedScopePhaseId(null);
      }
    }
  }, [roadmap, selectedScopePhaseId]);

  useEffect(() => {
    setMessages([]);
    setAppliedActionIds({});
    setRejectedActionIds({});
    if (isOpen && selectedProject?.id) {
      roadmapApi.getCopilotSession(selectedProject.id)
        .then((res) => {
          if (res.data?.messages && res.data.messages.length > 0) {
            const restored: RoadmapChatMessage[] = res.data.messages.map((m, idx) => ({
              id: `hist-${idx}`,
              sender: m.role === 'user' ? 'user' : 'assistant',
              text: m.content || '',
              timestamp: '',
              copilotResponse: m.response,
            }));
            setMessages(restored);
          } else {
            setMessages([
              {
                id: 'welcome',
                sender: 'assistant',
                text: `Hello! I am your **DevPilot AI Roadmap Copilot**. I can customize your project architecture, advise on and update your tech stack, and adjust any phase or tasks for **${selectedProject.name}**. Feel free to ask questions, request tech stack migrations, or add new features.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        })
        .catch(() => {
          setMessages([
            {
              id: 'welcome',
              sender: 'assistant',
              text: `Hello! I am your **DevPilot AI Roadmap Copilot**. I can customize your project architecture, advise on and update your tech stack, and adjust any phase or tasks for **${selectedProject.name}**. Feel free to ask questions, request tech stack migrations, or add new features.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        });
    }
  }, [isOpen, selectedProject?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isLoading) return;

    const userMsg: RoadmapChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const historyPayload = messages.slice(-12).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const completedIds = completedTaskIds
      ? Object.keys(completedTaskIds)
          .filter((id) => completedTaskIds[Number(id)])
          .map(Number)
      : [];

    try {
      const res = await roadmapApi.chatCopilot(
        selectedProject.id,
        content,
        historyPayload,
        selectedScopePhaseId || undefined,
        completedIds
      );

      if (res.data) {
        const assistantMsg: RoadmapChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: res.data.explanation || 'I have analyzed your request.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          copilotResponse: res.data,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: RoadmapChatMessage = {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: res.error || 'Unable to process request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (_) {
      const errorMsg: RoadmapChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'AI Copilot service is temporarily unreachable. Please try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAction = async (msgId: string, copilotRes: RoadmapCopilotResponse) => {
    if (copilotRes.action === 'none') return;
    setApplyingMessageId(msgId);

    let targetId = copilotRes.target_phase_id;
    let targetOrder = copilotRes.target_phase_order;

    if (copilotRes.action === 'edit_phase' || copilotRes.action === 'delete_phase') {
      let matchedPhase = null;
      if (targetOrder) {
        matchedPhase = roadmap?.phases.find((p) => p.order === targetOrder);
      }
      if (!matchedPhase && copilotRes.phase_data?.title) {
        matchedPhase = roadmap?.phases.find(
          (p) => p.title.toLowerCase().trim() === copilotRes.phase_data!.title.toLowerCase().trim()
        );
      }
      if (!matchedPhase && activePhaseId) {
        matchedPhase = roadmap?.phases.find((p) => p.id === activePhaseId);
      }
      if (!matchedPhase && targetId) {
        matchedPhase = roadmap?.phases.find((p) => p.id === targetId);
      }

      if (matchedPhase) {
        targetId = matchedPhase.id;
        targetOrder = matchedPhase.order;
      }
    }

    try {
      const res = await roadmapApi.applyPhaseAction(selectedProject.id, {
        action: copilotRes.action,
        phase_data: copilotRes.phase_data,
        target_phase_id: targetId,
        target_phase_order: targetOrder,
        new_tech_stack: copilotRes.new_tech_stack,
        affected_phases: copilotRes.affected_phases,
        change_summary: copilotRes.change_summary,
        roadmap_version: copilotRes.roadmap_version,
      });

      if (res.error || !res.data) {
        const errorText = res.error || 'Failed to apply changes.';
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: `⚠️ **Proposal Stale / Update Blocked**: ${errorText}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      if (res.data?.roadmap) {
        onRoadmapUpdated(res.data.roadmap, res.data.project);
        setAppliedActionIds((prev) => ({ ...prev, [msgId]: true }));
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            sender: 'assistant',
            text: `Roadmap updated successfully! The new changes are now active on your board.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to apply roadmap changes.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Error**: ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setApplyingMessageId(null);
    }
  };

  const handleRejectAction = (msgId: string) => {
    setRejectedActionIds((prev) => ({ ...prev, [msgId]: true }));
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: `Chat reset. Feel free to ask questions about **${selectedProject.name}** or prompt me to customize the tech stack or phases.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  const quickPrompts = [
    'Explain roadmap architecture & phases',
    'Analyze dependencies & potential risks',
    'Add test automation & CI/CD pipeline',
    'Recommend optimal tech stack',
    ...(selectedScopePhase
      ? [`Explain Phase 0${selectedScopePhase.order}: ${selectedScopePhase.title}`]
      : activePhase
      ? [`Explain Phase 0${activePhase.order}: ${activePhase.title}`]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end transition-all duration-300">
      <div
        onClick={onClose}
        aria-label="Close copilot"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full sm:w-[560px] md:w-[620px] h-full flex flex-col shadow-2xl transition-transform border-l ${
          isDark
            ? 'bg-[#0A0A0A] border-[#222222] text-[#E5E5E5]'
            : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#1E1E1E]'
        }`}
      >
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'bg-[#0F0F0F] border-[#222222]' : 'bg-white border-[#E5E0D8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-sm ${
                isDark ? 'bg-[#FFC900] text-black' : 'bg-[#FFC900] text-black'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight">Roadmap AI Copilot</h3>
                <span
                  className={`text-[10px] font-base px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                    isDark
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/70'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  Architect Intelligence
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {activePhase
                  ? `Pinned Context: Phase ${activePhase.order} • ${activePhase.title}`
                  : `Scope & Phase Engineering for ${selectedProject.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              title="Reset conversation"
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-600'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Copilot"
              className={`p-2 rounded-lg  cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 border-b overflow-x-auto flex gap-2 no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className={`whitespace-nowrap px-3 cursor-pointer py-1.5 rounded-lg text-xs font-medium transition-all border shrink-0 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-[#FFC900]/10 hover:border-[#FFC900]/40 hover:text-[#FFC900]'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-[#FFC900]/15 hover:border-[#FFC900]/60 hover:text-black'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const copilot = msg.copilotResponse;
            const isApplied = !!appliedActionIds[msg.id];
            const isApplying = applyingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border shadow-xs ${
                      isDark
                        ? 'bg-[#18181B] border-[#27272A] text-[#FFC900]'
                        : 'bg-[#FFC900]/15 border-[#FFC900]/50 text-[#B48200]'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="max-w-[84%] sm:max-w-[80%] space-y-2.5">
                  <div
                    className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed border shadow-xs ${
                      isUser
                        ? isDark
                          ? 'bg-[#FFC900] text-[#08090B] font-medium border-[#FFC900] rounded-tr-xs'
                          : 'bg-[#1C1917] text-[#FAFAF9] font-normal border-stone-800 rounded-tr-xs'
                        : isDark
                        ? 'bg-[#141416] border-[#27272A] text-stone-200 rounded-tl-xs'
                        : 'bg-white border-stone-200 text-stone-900 rounded-tl-xs'
                    }`}
                  >
                    {renderFormattedMessage(msg.text, isDark, isUser)}
                    <div
                      className={`text-[10px] mt-1.5 text-right font-base opacity-60 ${
                        isUser
                          ? isDark
                            ? 'text-black'
                            : 'text-stone-300'
                          : isDark
                          ? 'text-stone-400'
                          : 'text-stone-500'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {copilot && (
                    <CopilotActionProposalCard
                      copilot={copilot}
                      msgId={msg.id}
                      selectedProject={selectedProject}
                      isApplied={isApplied}
                      isApplying={isApplying}
                      rejectedActionIds={rejectedActionIds}
                      isDark={isDark}
                      handleApplyAction={handleApplyAction}
                      handleRejectAction={handleRejectAction}
                    />
                  )}
                </div>

                {isUser && (
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border shadow-xs ${
                      isDark
                        ? 'bg-[#FFC900] border-[#FFC900] text-[#08090B]'
                        : 'bg-[#1C1917] border-stone-800 text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center justify-start">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border shadow-xs ${
                  isDark
                    ? 'bg-[#18181B] border-[#27272A] text-[#FFC900]'
                    : 'bg-[#FFC900]/15 border-[#FFC900]/50 text-[#B48200]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div
                className={`px-4 py-2.5 rounded-2xl rounded-tl-xs border flex items-center gap-2 shadow-xs ${
                  isDark
                    ? 'bg-[#141416] border-[#27272A] text-stone-300'
                    : 'bg-white border-stone-200 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC900] animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC900] animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC900] animate-bounce"></span>
                </div>
                <span className="text-sm font-base ml-1 opacity-70">Reasoning...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <CopilotChatInput
          roadmap={roadmap}
          selectedScopePhaseId={selectedScopePhaseId}
          setSelectedScopePhaseId={setSelectedScopePhaseId}
          selectedScopePhase={selectedScopePhase}
          inputText={inputText}
          setInputText={setInputText}
          isLoading={isLoading}
          isDark={isDark}
          handleSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
