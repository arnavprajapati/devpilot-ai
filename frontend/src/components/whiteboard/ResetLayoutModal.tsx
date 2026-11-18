import { RotateCcw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ResetLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetLayoutModal({
  isOpen,
  onClose,
  onConfirm,
}: ResetLayoutModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`border shadow-2xl w-full max-w-sm p-6 text-center space-y-4 ${
          isDark
            ? 'border-[#242321] bg-[#18191D]'
            : 'border-[#E8E1D5] bg-white'
        }`}
      >
        <div
          className={`w-12 h-12 border flex items-center justify-center mx-auto ${
            isDark
              ? 'bg-[#FFC900]/15 text-[#FFC900] border-[#FFC900]/30'
              : 'bg-[#D9A300]/15 text-[#D9A300] border-[#D9A300]/30'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
        </div>
        <div>
          <h4
            className={`text-lg font-bold tracking-tight ${
              isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
            }`}
          >
            Reset Whiteboard?
          </h4>
          <p
            className={`text-sm mt-1.5 leading-relaxed font-normal ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            This will re-align all phases, milestones, and tasks into the initial Left-to-Right
            flowchart. Any custom layout rearrangement will be reset.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
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
            className={`px-6 py-2.5 text-sm font-bold tracking-tight transition-all shadow-xs cursor-pointer ${
              isDark
                ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                : 'bg-[#D9A300] text-white hover:brightness-105'
            }`}
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
}
