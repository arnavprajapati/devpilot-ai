import { useState } from 'react';
import {
  X,
  RotateCcw,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Code2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex justify-end font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-200">
      <div
        onClick={onClose}
        aria-label="Close diff drawer"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full sm:w-[620px] md:w-[720px] lg:w-[780px] h-full flex flex-col shadow-2xl transition-transform border-l overflow-hidden ${
          isDark
            ? 'bg-[#08090B] border-[#242321] text-[#F5F3EF]'
            : 'bg-[#FAF8F5] border-[#E8E1D5] text-[#171717]'
        }`}
      >
        <div
          className={`px-6 py-5 border-b flex items-center justify-between gap-4 shrink-0 ${
            isDark ? 'bg-[#111215] border-[#242321]' : 'bg-white border-[#E8E1D5]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold shadow-xs ${
                isDark
                  ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                  : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base sm:text-lg tracking-tight">
                  Schema Regeneration Proposal
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                    isDark
                      ? 'bg-[#FFC900]/15 text-[#FFC900] border-[#FFC900]/30'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  Review Proposal
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}`}>
                Derived from latest roadmap & tech stack context
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:border-[#FFC900]/40'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:border-[#D9A300]/40'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {staleError && (
          <div className="px-6 py-3.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between gap-3 text-xs sm:text-sm text-rose-400 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{staleError}</span>
            </div>
            <button
              type="button"
              onClick={onRegenerateFresh}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors cursor-pointer shrink-0"
            >
              Regenerate Fresh
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div
            className={`p-5 rounded-2xl border flex flex-col gap-3 shadow-xs ${
              isDark
                ? 'bg-[#111215] border-[#242321]'
                : 'bg-white border-[#E8E1D5]'
            }`}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                      : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
                  }`}
                >
                  {isDocument ? <FileCode2 className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                  <span>{proposal.db_engine}</span>
                  <span className="text-xs opacity-75 font-medium">
                    ({isDocument ? 'Document NoSQL' : 'Relational SQL'})
                  </span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A6A4A0]">
                  Project Architecture
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer transition-colors ${
                  showCode
                    ? isDark
                      ? 'bg-[#FFC900] text-[#08090B] font-bold border-[#FFC900]'
                      : 'bg-[#D9A300] text-white font-bold border-[#D9A300]'
                    : isDark
                    ? 'border-[#242321] bg-[#18191D] text-[#A6A4A0] hover:text-[#F5F3EF]'
                    : 'border-[#E8E1D5] bg-stone-50 text-[#6B665E] hover:text-[#171717]'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>{showCode ? 'View Entities' : 'View Code'}</span>
              </button>
            </div>

            <p
              className={`text-sm sm:text-base font-semibold leading-relaxed ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              {proposal.summary}
            </p>

            {proposal.rationale && (
              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                {proposal.rationale}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`p-4 rounded-2xl border flex flex-col gap-1.5 shadow-xs ${
                isDark
                  ? 'bg-[#111215] border-[#242321]'
                  : 'bg-white border-[#E8E1D5]'
              }`}
            >
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Added
              </span>
              <span className={`text-xl font-extrabold ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                {addedEntities.length}
              </span>
              <span className="text-xs text-[#A6A4A0] truncate">
                {addedEntities.length > 0 ? addedEntities.join(', ') : 'None'}
              </span>
            </div>

            <div
              className={`p-4 rounded-2xl border flex flex-col gap-1.5 shadow-xs ${
                isDark
                  ? 'bg-[#111215] border-[#242321]'
                  : 'bg-white border-[#E8E1D5]'
              }`}
            >
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Preserved
              </span>
              <span className={`text-xl font-extrabold ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                {preservedEntities.length}
              </span>
              <span className="text-xs text-[#A6A4A0] truncate">
                {preservedEntities.length > 0 ? preservedEntities.join(', ') : 'None'}
              </span>
            </div>

            <div
              className={`p-4 rounded-2xl border flex flex-col gap-1.5 shadow-xs ${
                isDark
                  ? 'bg-[#111215] border-[#242321]'
                  : 'bg-white border-[#E8E1D5]'
              }`}
            >
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Modified
              </span>
              <span className={`text-xl font-extrabold ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                {modifiedEntities.length}
              </span>
              <span className="text-xs text-[#A6A4A0] truncate">
                {modifiedEntities.length > 0 ? modifiedEntities.join(', ') : 'None'}
              </span>
            </div>

            <div
              className={`p-4 rounded-2xl border flex flex-col gap-1.5 shadow-xs ${
                isDark
                  ? 'bg-[#111215] border-[#242321]'
                  : 'bg-white border-[#E8E1D5]'
              }`}
            >
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                Removed
              </span>
              <span className={`text-xl font-extrabold ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                {removedEntities.length}
              </span>
              <span className="text-xs text-[#A6A4A0] truncate">
                {removedEntities.length > 0 ? removedEntities.join(', ') : 'None'}
              </span>
            </div>
          </div>

          {showCode ? (
            <div
              className={`p-5 rounded-2xl border overflow-hidden ${
                isDark
                  ? 'bg-[#111215] border-[#242321]'
                  : 'bg-[#18191D] border-[#E8E1D5]'
              }`}
            >
              <pre className="font-mono text-xs sm:text-sm text-stone-200 whitespace-pre-wrap max-h-[480px] overflow-y-auto leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {proposal.code || 'No code representation available.'}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}`}>
                Proposed Entities & Fields ({tables.length})
              </h4>
              <div className="grid grid-cols-1 gap-3.5">
                {tables.map((t) => {
                  const isAdded = addedEntities.includes(t.name.toLowerCase());
                  const isPreserved = preservedEntities.includes(t.name.toLowerCase());
                  return (
                    <div
                      key={t.name}
                      className={`p-5 rounded-2xl border flex flex-col gap-2.5 transition-all shadow-xs ${
                        isDark
                          ? 'bg-[#111215] border-[#242321] hover:border-[#FFC900]/30'
                          : 'bg-white border-[#E8E1D5] hover:border-[#D9A300]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-sm sm:text-base tracking-tight">
                            {t.name}
                          </span>
                          {isAdded && (
                            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Added
                            </span>
                          )}
                          {isPreserved && (
                            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              Preserved
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#A6A4A0] font-mono font-medium">
                          {(t.columns || []).length} {isDocument ? 'fields' : 'columns'}
                        </span>
                      </div>

                      {t.description && (
                        <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}`}>
                          {t.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(t.columns || []).slice(0, 10).map((c) => (
                          <span
                            key={c.name}
                            className={`text-xs px-2.5 py-1 rounded-lg font-mono border ${
                              c.is_primary
                                ? 'bg-[#FFC900]/15 text-[#FFC900] border-[#FFC900]/30 font-bold'
                                : c.is_foreign
                                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-semibold'
                                : isDark
                                ? 'bg-[#18191D] text-[#D4D2CD] border-[#242321]'
                                : 'bg-[#F7F3EA] text-[#4A463F] border-[#E8E1D5]'
                            }`}
                          >
                            {c.name}
                            {c.is_primary && '*'}
                          </span>
                        ))}
                        {(t.columns || []).length > 10 && (
                          <span className="text-xs px-2 py-1 text-[#A6A4A0] font-mono">
                            +{(t.columns || []).length - 10} more
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
          className={`px-6 py-4 border-t flex items-center justify-between gap-4 shrink-0 ${
            isDark ? 'bg-[#111215] border-[#242321]' : 'bg-white border-[#E8E1D5]'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF]'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717]'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(proposal)}
            disabled={isSaving || Boolean(staleError)}
            className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                : 'bg-[#D9A300] text-white hover:brightness-105'
            }`}
          >
            {isSaving ? (
              <span>Saving Architecture...</span>
            ) : (
              <>
                <span>Apply Architecture</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}