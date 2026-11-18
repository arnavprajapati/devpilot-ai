import { RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface RegenerateRoadmapModalProps {
  isOpen: boolean;
  hasCustomizedWhiteboard: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RegenerateRoadmapModal({
  isOpen,
  hasCustomizedWhiteboard,
  onClose,
  onConfirm,
}: RegenerateRoadmapModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`border shadow-2xl w-full max-w-md p-6 text-center ${
          isDark
            ? 'border-[#242321] bg-[#18191D]'
            : 'border-[#E8E1D5] bg-white'
        }`}
      >
        <div
          className={`w-12 h-12 border flex items-center justify-center mx-auto mb-4 ${
            isDark
              ? 'bg-[#FFC900]/15 text-[#FFC900] border-[#FFC900]/30'
              : 'bg-[#D9A300]/15 text-[#D9A300] border-[#D9A300]/30'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
        </div>
        <h4
          className={`text-lg font-bold mb-1 tracking-tight ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          Regenerate Roadmap?
        </h4>
        <p
          className={`text-sm mb-4 leading-relaxed font-normal ${
            isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
          }`}
        >
          This will generate a fresh development roadmap and replace the current one.
        </p>

        {hasCustomizedWhiteboard && (
          <div
            className={`mb-4 p-3.5 text-xs text-left flex items-start gap-2.5 border ${
              isDark
                ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong className="font-semibold">Notice:</strong> You have manual edits on your interactive whiteboard.
              Regenerating will replace your customized flowchart layout.
            </span>
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 border text-sm font-semibold tracking-tight transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:bg-stone-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                : 'bg-[#D9A300] text-white hover:brightness-105'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirm Regenerate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
