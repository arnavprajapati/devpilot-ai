import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Bot,
  User,
  RotateCcw,
  Layers,
  ArrowRight,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Project } from '../../services/projectsApi';
import type { Roadmap, RoadmapCopilotResponse } from '../../services/roadmapApi';
import { roadmapApi } from '../../services/roadmapApi';

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

function renderInlineTokens(text: string, isDark: boolean, isUser: boolean = false, inTable: boolean = false) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return tokens.map((token, tIdx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      const boldContent = token.slice(2, -2);
      if (inTable) {
        return (
          <strong
            key={tIdx}
            className={`font-semibold ${
              isDark ? 'text-amber-300' : 'text-stone-950 font-bold'
            }`}
          >
            {boldContent}
          </strong>
        );
      }
      return (
        <span
          key={tIdx}
          className={`inline-block px-1.5 py-0.5 rounded font-bold mx-0.5 ${
            isUser
              ? isDark
                ? 'bg-black/30 text-white'
                : 'bg-white/20 text-white'
              : isDark
              ? 'bg-[#FFC900]/20 text-[#FFD84D] border-b-2 border-[#FFC900]'
              : 'bg-[#FFC900]/30 text-[#6B4E00] border-b-2 border-[#D9A300]'
          }`}
        >
          {boldContent}
        </span>
      );
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      const codeContent = token.slice(1, -1);
      return (
        <code
          key={tIdx}
          className={`font-mono text-xs px-1.5 py-0.5 rounded border mx-0.5 font-medium ${
            isUser
              ? isDark
                ? 'bg-black/20 text-[#08090B] border-black/30'
                : 'bg-white/20 text-white border-white/30'
              : isDark
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {codeContent}
        </code>
      );
    }
    return (
      <span
        key={tIdx}
        className={
          isUser
            ? isDark
              ? 'text-black font-medium'
              : 'text-white'
            : isDark
            ? 'text-stone-200'
            : 'text-stone-900'
        }
      >
        {token}
      </span>
    );
  });
}

type MessageBlock =
  | { type: 'heading'; level: number; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'paragraph'; content: string }
  | { type: 'space' };

function parseMessageBlocks(text: string): MessageBlock[] {
  const lines = text.split('\n');
  const blocks: MessageBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      blocks.push({ type: 'space' });
      i++;
      continue;
    }

    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const content = trimmed.replace(/^#+\s*/, '');
      blocks.push({ type: 'heading', level, content });
      i++;
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parsedRows = tableLines.map((tl) => {
          const stripped = tl.replace(/^\|/, '').replace(/\|$/, '');
          return stripped.split('|').map((c) => c.trim());
        });
        const headers = parsedRows[0];
        const isSeparator = parsedRows[1].every((cell) => /^:?-+:?$/.test(cell.replace(/\s+/g, '')));
        const rows = isSeparator ? parsedRows.slice(2) : parsedRows.slice(1);
        blocks.push({ type: 'table', headers, rows });
        continue;
      } else {
        blocks.push({ type: 'paragraph', content: tableLines[0] });
        continue;
      }
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items, ordered: false });
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items, ordered: true });
      continue;
    }

    blocks.push({ type: 'paragraph', content: rawLine });
    i++;
  }

  return blocks;
}

function renderFormattedMessage(text: string, isDark: boolean, isUser: boolean = false) {
  if (!text) return null;
  const blocks = parseMessageBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, bIdx) => {
        if (block.type === 'space') {
          return <div key={bIdx} className="h-1" />;
        }

        if (block.type === 'heading') {
          return (
            <div
              key={bIdx}
              className={`flex items-center gap-2 pt-2.5 pb-0.5 font-bold text-[14px] ${
                isDark ? 'text-white' : 'text-stone-950'
              }`}
            >
              <span className="w-1.5 h-3.5 bg-[#FFC900] rounded-full inline-block shrink-0"></span>
              <span className={isDark ? 'text-white font-bold' : 'text-stone-950 font-bold'}>
                {renderInlineTokens(block.content, isDark, isUser)}
              </span>
            </div>
          );
        }

        if (block.type === 'table') {
          return (
            <div
              key={bIdx}
              className={`my-3 overflow-x-auto rounded-xl border ${
                isDark ? 'border-stone-800 bg-[#121214]' : 'border-stone-200 bg-white'
              } shadow-xs`}
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark
                        ? 'border-stone-800 bg-stone-900/80 text-stone-200'
                        : 'border-stone-200 bg-stone-50/90 text-stone-700'
                    }`}
                  >
                    {block.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3 py-2 font-semibold text-xs tracking-tight whitespace-nowrap"
                      >
                        {renderInlineTokens(h, isDark, isUser, true)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-stone-800/60' : 'divide-stone-100'}`}>
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-stone-800/20' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-3 py-2 text-xs align-top leading-relaxed ${
                            isDark ? 'text-stone-300' : 'text-stone-800'
                          }`}
                        >
                          {renderInlineTokens(cell, isDark, isUser, true)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <div key={bIdx} className="space-y-1.5 pl-1 my-1">
              {block.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-start gap-2 text-[13.5px] leading-relaxed">
                  {block.ordered ? (
                    <span className="font-mono text-xs font-semibold text-[#FFC900] mt-0.5 shrink-0">
                      {itemIdx + 1}.
                    </span>
                  ) : (
                    <span className="text-[#FFC900] font-bold text-xs mt-1 shrink-0">•</span>
                  )}
                  <div className={`flex-1 ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                    {renderInlineTokens(item, isDark, isUser)}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        return (
          <p
            key={bIdx}
            className={`leading-relaxed text-[13.5px] sm:text-[14px] ${
              isDark ? 'text-stone-200' : 'text-stone-900'
            }`}
          >
            {renderInlineTokens(block.content, isDark, isUser)}
          </p>
        );
      })}
    </div>
  );
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePhase = roadmap?.phases.find((p) => p.id === activePhaseId);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello! I am your **DevPilot AI Roadmap Copilot**. I can customize your project architecture, advise on and update your tech stack, and adjust any phase or tasks for **${selectedProject.name}**. Feel free to ask questions, request tech stack migrations, or add new features.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, selectedProject.name]);

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

    const historyPayload = messages.slice(-6).map((m) => ({
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
        activePhaseId || undefined,
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
          text: 'Unable to process request. Please try again.',
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

    try {
      const res = await roadmapApi.applyPhaseAction(selectedProject.id, {
        action: copilotRes.action,
        phase_data: copilotRes.phase_data,
        target_phase_id: copilotRes.target_phase_id,
        target_phase_order: copilotRes.target_phase_order,
        new_tech_stack: copilotRes.new_tech_stack,
        affected_phases: copilotRes.affected_phases,
      });

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
    } catch (_) {
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
    'Recommend optimal tech stack',
    'Use PostgreSQL instead of MongoDB',
    'Add image sharing to chat',
    'Explain roadmap architecture & phases',
    ...(activePhase ? [`Ask about Phase 0${activePhase.order}: ${activePhase.title}`] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div
        className={`w-full sm:w-[560px] md:w-[620px] h-full flex flex-col shadow-2xl transition-transform border-l ${
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
                                    <span className="font-mono text-[11px] font-bold text-[#FFC900]">0{pIdx + 1}</span>
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
                        ) : rejectedActionIds[msg.id] ? (
                          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                            isDark ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}>
                            Proposal Dismissed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectAction(msg.id)}
                              disabled={isApplying}
                              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                                isDark ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApplyAction(msg.id, copilot)}
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
                                    <span className="font-mono text-[11px] font-bold text-[#FFC900]">0{pIdx + 1}</span>
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
                        ) : rejectedActionIds[msg.id] ? (
                          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                            isDark ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}>
                            Proposal Dismissed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectAction(msg.id)}
                              disabled={isApplying}
                              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                                isDark ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApplyAction(msg.id, copilot)}
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
                            {copilot.action === 'add_phase' ? '+ New Phase Proposal' : 'Phase Update'}
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
                        ) : rejectedActionIds[msg.id] ? (
                          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                            isDark ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}>
                            Proposal Dismissed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectAction(msg.id)}
                              disabled={isApplying}
                              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                                isDark ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApplyAction(msg.id, copilot)}
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
                        ) : rejectedActionIds[msg.id] ? (
                          <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                            isDark ? 'bg-stone-900 border-stone-800 text-stone-500' : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}>
                            Proposal Dismissed
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectAction(msg.id)}
                              disabled={isApplying}
                              className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors cursor-pointer ${
                                isDark ? 'border-stone-700 hover:bg-stone-800 text-stone-300' : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleApplyAction(msg.id, copilot)}
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

        <div
          className={`p-3.5 sm:p-4 border-t ${
            isDark ? 'bg-[#0D0D0D] border-[#222222]' : 'bg-white border-[#E5E0D8]'
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask AI to explain, add, edit, or remove phases..."
              disabled={isLoading}
              className={`flex-1 px-4 py-3 rounded-xl border text-sm sm:text-[15px] focus:outline-none transition-all ${
                isDark
                  ? 'bg-[#161616] border-[#2E2E2E] text-white placeholder-gray-500 focus:border-[#FFC900]'
                  : 'bg-gray-50 border-gray-300 text-black placeholder-gray-400 focus:border-[#FFC900]'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-3 cursor-pointer rounded-xl bg-[#FFC900] hover:bg-[#E5B500] text-black font-bold flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-[#FFC900] active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
