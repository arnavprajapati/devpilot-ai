import {
  Save,
  RotateCcw,
  Code2,
  Plus,
  Database,
  FileCode2,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface DatabaseSchemaHeaderProps {
  schemaType: 'table' | 'document';
  dbEngine: string;
  hasUnsavedChanges: boolean;
  hasConflict?: boolean;
  isSaving: boolean;
  historyLength: number;
  redoStackLength: number;
  hasSelection: boolean;
  canPaste: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
  onAddEntity: () => void;
  onOpenExport: () => void;
  onResetLayout: () => void;
  onSave: () => void;
}

export function DatabaseSchemaHeader({
  schemaType,
  dbEngine,
  hasUnsavedChanges,
  hasConflict,
  isSaving,
  historyLength,
  redoStackLength,
  hasSelection,
  canPaste,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onEditSelected,
  onDeleteSelected,
  onAddEntity,
  onOpenExport,
  onResetLayout,
  onSave,
}: DatabaseSchemaHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header
      className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 z-20 shrink-0 font-['Plus_Jakarta_Sans',sans-serif] ${
        isDark ? 'bg-[#08090B] border-[#242321]' : 'bg-white border-[#E8E1D5]'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-0.5">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            isDark
              ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF]'
              : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#171717]'
          }`}
        >
          {schemaType === 'document' ? (
            <FileCode2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Database className="w-4 h-4 text-amber-500" />
          )}
          <span className="text-xs font-bold">{dbEngine}</span>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              isDark
                ? 'bg-white/10 text-[#A6A4A0]'
                : 'bg-black/5 text-[#6B665E]'
            }`}
          >
            {schemaType === 'document' ? 'NoSQL Document Schema' : 'Relational SQL Schema'}
          </span>
        </div>

        {hasConflict && (
          <span
            title="Conflicting database technologies detected in project specifications. Both representations were preserved."
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Legacy Conflict Preserved</span>
          </span>
        )}

        <span
          className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
            isDark
              ? 'border-[#242321] bg-[#18191D] text-[#A6A4A0]'
              : 'border-[#E8E1D5] bg-[#F7F3EA] text-[#6B665E]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{dbEngine}</span>
        </span>

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

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <div
          className={`inline-flex items-center p-0.5 rounded-xl border ${
            isDark ? 'border-[#242321] bg-[#18191D]' : 'border-[#E8E1D5] bg-[#F7F3EA]'
          }`}
        >
          <button
            type="button"
            onClick={onUndo}
            disabled={historyLength === 0}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-white'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={redoStackLength === 0}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-white'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div
            className={`w-[1px] h-4 mx-0.5 ${
              isDark ? 'bg-[#242321]' : 'bg-[#E8E1D5]'
            }`}
          />

          <button
            type="button"
            onClick={onCut}
            disabled={!hasSelection}
            title="Cut Selected (Ctrl+X)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onCopy}
            disabled={!hasSelection}
            title="Copy Selected (Ctrl+C)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onPaste}
            disabled={!canPaste}
            title="Paste (Ctrl+V)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-white'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>

          <div
            className={`w-[1px] h-4 mx-0.5 ${
              isDark ? 'bg-[#242321]' : 'bg-[#E8E1D5]'
            }`}
          />

          <button
            type="button"
            onClick={onEditSelected}
            disabled={!hasSelection}
            title="Edit Selected Entity"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#FFC900] hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-[#D9A300] hover:bg-white'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            title="Delete Selected Entity (Delete / Backspace)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? 'text-[#A6A4A0] hover:text-rose-400 hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-rose-600 hover:bg-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onAddEntity}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] hover:border-[#FFC900]'
              : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#171717] hover:border-[#D9A300]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{schemaType === 'table' ? '+ Add Table' : '+ Add Collection'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          title="Export SQL / Mongoose Code"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] hover:border-[#FFC900]'
              : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#171717] hover:border-[#D9A300]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Code</span>
        </button>

        <button
          type="button"
          onClick={onResetLayout}
          title="Auto-organize Layout"
          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
            isDark
              ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#18191D]'
              : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
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
          <span>Save Schema</span>
        </button>
      </div>
    </header>
  );
}
