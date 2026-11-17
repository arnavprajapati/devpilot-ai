import { RotateCcw } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mx-auto">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-zinc-950">Reset Whiteboard?</h4>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            This will re-align all phases, milestones, and tasks into the initial Left-to-Right
            flowchart. Any custom layout rearrangement will be reset.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 shadow-sm cursor-pointer"
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
}
