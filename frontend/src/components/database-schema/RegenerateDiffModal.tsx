import { useState } from 'react';
import { X, RotateCcw, Database, Layers, CheckCircle2, AlertTriangle, FileCode2, Code2, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { DatabaseSchemaProposalDiff } from '../../services/databaseSchemaApi';

interface RegenerateDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: DatabaseSchemaProposalDiff | null;
  isSaving: boolean;
  staleError: string | null;
  onConfirm: (proposal: DatabaseSchemaProposalDiff) => void;
  onRegenerateFresh: () => void;
}

export function RegenerateDiffModal({
  isOpen,
  onClose,
  proposal,
  isSaving,
  staleError,
  onConfirm,
  onRegenerateFresh,
}: RegenerateDiffModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showCode, setShowCode] = useState(false);

  if (!isOpen || !proposal) return null;

  const addedEntities = proposal.added_entities || [];
  const modifiedEntities = proposal.modified_entities || [];
  const preservedEntities = proposal.preserved_entities || [];
  const removedEntities = proposal.removed_entities || [];
  const tables = proposal.tables || [];
  const isDocument = proposal.schema_type === 'document';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'border-[#242321] bg-[#111215]'
            : 'border-[#E8E1D5] bg-white'
        }`}
      >
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isDark
              ? 'bg-[#18191D] border-[#242321]'
              : 'bg-[#F7F3EA] border-[#E8E1D5]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                isDark
                  ? 'bg-[#08090B] border-[#242321] text-[#FFC900]'
                  : 'bg-white border-[#E8E1D5] text-[#D9A300]'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3
                className={`text-base font-bold tracking-tight ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                Database Schema Regeneration Diff
              </h3>
              <p
                className={`text-xs ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Review proposed schema architecture derived from your latest project context
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:border-[#FFC900]/50'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:border-[#D9A300]/50'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {staleError && (
          <div className="px-6 py-3 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between gap-3 text-xs text-rose-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{staleError}</span>
            </div>
            <button
              type="button"
              onClick={onRegenerateFresh}
              disabled={isSaving}
              className="px-3 py-1 rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors cursor-pointer shrink-0"
            >
              Regenerate Fresh
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div
            className={`p-4 rounded-xl border flex flex-col gap-2 ${
              isDark
                ? 'bg-[#18191D]/80 border-[#242321]'
                : 'bg-[#F7F3EA]/70 border-[#E8E1D5]'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                    isDark
                      ? 'bg-[#08090B] border-[#343330] text-[#FFC900]'
                      : 'bg-white border-[#E8E1D5] text-[#D9A300]'
                  }`}
                >
                  {isDocument ? <FileCode2 className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
                  <span>{proposal.db_engine}</span>
                  <span className="text-[10px] opacity-70">({isDocument ? 'Document NoSQL' : 'Relational SQL'})</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A6A4A0]">
                  Project Architecture
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                  showCode
                    ? isDark
                      ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900]'
                      : 'bg-[#D9A300] text-white font-bold border-[#D9A300]'
                    : isDark
                    ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF]'
                    : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showCode ? 'View Entities' : 'View Code'}</span>
              </button>
            </div>
            <p
              className={`text-sm font-medium ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              {proposal.summary}
            </p>
            {proposal.rationale && (
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                {proposal.rationale}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 ${
                isDark
                  ? 'bg-[#18191D] border-[#242321]'
                  : 'bg-[#FAF8F5] border-[#E8E1D5]'
              }`}
            >
              <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Added
              </span>
              <span
                className={`text-lg font-bold ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                {addedEntities.length}
              </span>
              <span className="text-[11px] text-[#A6A4A0] truncate">
                {addedEntities.length > 0 ? addedEntities.join(', ') : 'None'}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 ${
                isDark
                  ? 'bg-[#18191D] border-[#242321]'
                  : 'bg-[#FAF8F5] border-[#E8E1D5]'
              }`}
            >
              <span className="text-[11px] font-semibold text-sky-500 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Preserved
              </span>
              <span
                className={`text-lg font-bold ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                {preservedEntities.length}
              </span>
              <span className="text-[11px] text-[#A6A4A0] truncate">
                {preservedEntities.length > 0 ? preservedEntities.join(', ') : 'None'}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 ${
                isDark
                  ? 'bg-[#18191D] border-[#242321]'
                  : 'bg-[#FAF8F5] border-[#E8E1D5]'
              }`}
            >
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />
                Modified
              </span>
              <span
                className={`text-lg font-bold ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                {modifiedEntities.length}
              </span>
              <span className="text-[11px] text-[#A6A4A0] truncate">
                {modifiedEntities.length > 0 ? modifiedEntities.join(', ') : 'None'}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 ${
                isDark
                  ? 'bg-[#18191D] border-[#242321]'
                  : 'bg-[#FAF8F5] border-[#E8E1D5]'
              }`}
            >
              <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                <X className="w-3 h-3" />
                Removed
              </span>
              <span
                className={`text-lg font-bold ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                {removedEntities.length}
              </span>
              <span className="text-[11px] text-[#A6A4A0] truncate">
                {removedEntities.length > 0 ? removedEntities.join(', ') : 'None'}
              </span>
            </div>
          </div>

          {showCode ? (
            <div
              className={`p-4 rounded-xl border ${
                isDark
                  ? 'bg-[#08090B] border-[#242321]'
                  : 'bg-stone-900 border-[#E8E1D5]'
              }`}
            >
              <pre className="font-mono text-xs text-stone-200 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                {proposal.code || 'No code representation available.'}
              </pre>
            </div>
          ) : (
            <div className="space-y-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Proposed Entities & Fields ({tables.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tables.map((t) => {
                  const isAdded = addedEntities.includes(t.name.toLowerCase());
                  const isPreserved = preservedEntities.includes(t.name.toLowerCase());
                  return (
                    <div
                      key={t.name}
                      className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        isDark
                          ? 'bg-[#18191D] border-[#242321]'
                          : 'bg-[#FAF8F5] border-[#E8E1D5]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs tracking-tight">
                            {t.name}
                          </span>
                          {isAdded && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                              Added
                            </span>
                          )}
                          {isPreserved && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400">
                              Preserved
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#A6A4A0]">
                          {(t.columns || []).length} {isDocument ? 'fields' : 'columns'}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-[11px] text-[#A6A4A0] line-clamp-1">
                          {t.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(t.columns || []).slice(0, 8).map((c) => (
                          <span
                            key={c.name}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                              c.is_primary
                                ? 'bg-[#FFC900]/20 text-[#FFC900] font-semibold'
                                : c.is_foreign
                                ? 'bg-sky-500/20 text-sky-400'
                                : isDark
                                ? 'bg-[#242321] text-[#A6A4A0]'
                                : 'bg-[#E8E1D5] text-[#6B665E]'
                            }`}
                          >
                            {c.name}
                            {c.is_primary && '*'}
                          </span>
                        ))}
                        {(t.columns || []).length > 8 && (
                          <span className="text-[10px] px-1 text-[#A6A4A0]">
                            +{(t.columns || []).length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className={`px-6 py-4 border-t flex items-center justify-between gap-4 ${
            isDark
              ? 'bg-[#18191D] border-[#242321]'
              : 'bg-[#F7F3EA] border-[#E8E1D5]'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#343330] text-[#A6A4A0] hover:text-[#F5F3EF]'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717]'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(proposal)}
            disabled={isSaving || Boolean(staleError)}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-gradient-to-r from-[#FFC900] to-[#E5A800] text-[#08090B] hover:brightness-110'
                : 'bg-[#D9A300] text-white hover:brightness-105'
            }`}
          >
            {isSaving ? (
              <span>Saving Architecture...</span>
            ) : (
              <>
                <span>Apply Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
