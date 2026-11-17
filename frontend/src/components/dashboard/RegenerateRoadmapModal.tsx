import { RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-5 h-5" />
        </div>
        <h4 className="text-base font-bold text-zinc-950 mb-1">Regenerate Roadmap?</h4>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          This will generate a fresh development roadmap and replace the current one.
        </p>

        {hasCustomizedWhiteboard && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong>Notice:</strong> You have manual edits on your interactive whiteboard.
              Regenerating will replace your customized flowchart layout.
            </span>
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF4055]" />
            <span>Confirm Regenerate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
