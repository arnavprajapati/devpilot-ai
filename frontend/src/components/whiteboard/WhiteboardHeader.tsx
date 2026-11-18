import {
  Save,
  RotateCcw,
  GitBranch,
  CheckCircle2,
  ListTodo,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Roadmap } from '../../services/roadmapApi';

interface WhiteboardHeaderProps {
  roadmap: Roadmap;
  selectedPhaseFilter: number | 'all';
  onSelectPhaseFilter: (filter: number | 'all') => void;
  hasUnsavedChanges: boolean;
  historyLength: number;
  redoStackLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onAddNode: (type: 'task' | 'milestone' | 'decision' | 'phase') => void;
  onOpenReset: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function WhiteboardHeader({
  roadmap,
  selectedPhaseFilter,
  onSelectPhaseFilter,
  hasUnsavedChanges,
  historyLength,
  redoStackLength,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onAddNode,
  onOpenReset,
  onSave,
  isSaving,
}: WhiteboardHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header
      className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 z-20 shrink-0 ${
        isDark ? 'bg-[#08090B] border-[#242321]' : 'bg-white border-[#E8E1D5]'
      }`}
    >
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        <div
          className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
            isDark
              ? 'bg-[#18191D] border-[#242321]'
              : 'bg-[#F7F3EA] border-[#E8E1D5]'
          }`}
        >
          {roadmap.phases.map((phase, idx) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => onSelectPhaseFilter(phase.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPhaseFilter === phase.id
                  ? isDark
                    ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-xs'
                    : 'bg-[#D9A300] text-white font-bold shadow-xs'
                  : isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                  : 'text-[#6B665E] hover:text-[#171717]'
              }`}
            >
              Phase {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSelectPhaseFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPhaseFilter === 'all'
                ? isDark
                  ? 'bg-[#FFC900] text-[#08090B] font-bold shadow-xs'
                  : 'bg-[#D9A300] text-white font-bold shadow-xs'
                : isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                : 'text-[#6B665E] hover:text-[#171717]'
            }`}
          >
            Full Roadmap
          </button>
        </div>

        {hasUnsavedChanges && (
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs ${
              isDark
                ? 'bg-[#FFC900] text-[#08090B]'
                : 'bg-[#D9A300] text-white'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isDark ? 'bg-[#08090B]' : 'bg-white'
              }`}
            />
            Unsaved Edits
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`hidden sm:flex items-center gap-1 border-r pr-2 mr-1 ${
            isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
          }`}
        >
          <button
            type="button"
            disabled={historyLength === 0}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#18191D]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={redoStackLength === 0}
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#18191D]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCut}
            title="Cut (Ctrl+X)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#18191D]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCopy}
            title="Copy (Ctrl+C)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#18191D]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onPaste}
            title="Paste (Ctrl+V / Ctrl+P)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#18191D]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          className={`hidden md:flex items-center gap-1.5 border-r pr-3 mr-1 ${
            isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
          }`}
        >
          <button
            type="button"
            onClick={() => onAddNode('task')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] hover:bg-[#242321]'
                : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#171717] hover:bg-stone-100'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-blue-500" />
            <span>+ Task</span>
          </button>
          <button
            type="button"
            onClick={() => onAddNode('milestone')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] hover:bg-[#242321]'
                : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#171717] hover:bg-stone-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>+ Milestone</span>
          </button>
          <button
            type="button"
            onClick={() => onAddNode('decision')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] hover:bg-[#242321]'
                : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#171717] hover:bg-stone-100'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-purple-500" />
            <span>+ Review Gate</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenReset}
          title="Reset to AI Layout"
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            isDark
              ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#18191D]'
              : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
            isDark
              ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
              : 'bg-[#D9A300] text-white hover:brightness-105'
          }`}
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Whiteboard</span>
        </button>
      </div>
    </header>
  );
}
