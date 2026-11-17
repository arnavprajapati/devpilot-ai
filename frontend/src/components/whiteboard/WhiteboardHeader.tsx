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
  return (
    <header className="px-6 py-3 border-b border-zinc-200/90 flex flex-wrap items-center justify-between gap-3 bg-white z-20 shrink-0">
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80">
          {roadmap.phases.map((phase) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => onSelectPhaseFilter(phase.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPhaseFilter === phase.id
                  ? 'bg-black text-white font-bold shadow-xs'
                  : 'text-zinc-700 hover:text-black hover:bg-white/80'
              }`}
            >
              Phase 0{phase.order}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSelectPhaseFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPhaseFilter === 'all'
                ? 'bg-black text-white font-bold shadow-xs'
                : 'text-zinc-700 hover:text-black hover:bg-white/80'
            }`}
          >
            Full Roadmap
          </button>
        </div>

        {hasUnsavedChanges && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Unsaved Edits
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 border-r border-zinc-200 pr-2 mr-1">
          <button
            type="button"
            disabled={historyLength === 0}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-zinc-800 hover:text-black hover:bg-zinc-100 disabled:text-zinc-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={redoStackLength === 0}
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-zinc-800 hover:text-black hover:bg-zinc-100 disabled:text-zinc-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCut}
            title="Cut (Ctrl+X)"
            className="p-1.5 rounded-lg text-zinc-800 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCopy}
            title="Copy (Ctrl+C)"
            className="p-1.5 rounded-lg text-zinc-800 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onPaste}
            title="Paste (Ctrl+V / Ctrl+P)"
            className="p-1.5 rounded-lg text-zinc-800 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1.5 border-r border-zinc-200 pr-3 mr-1">
          <button
            type="button"
            onClick={() => onAddNode('task')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ListTodo className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Task</span>
          </button>
          <button
            type="button"
            onClick={() => onAddNode('milestone')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Milestone</span>
          </button>
          <button
            type="button"
            onClick={() => onAddNode('decision')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 text-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Review Gate</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenReset}
          title="Reset to AI Layout"
          className="p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] text-white text-xs font-bold hover:opacity-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Whiteboard</span>
        </button>
      </div>
    </header>
  );
}
