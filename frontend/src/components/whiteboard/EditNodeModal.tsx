import { X } from 'lucide-react';

interface EditNodeModalProps {
  node: { id: string; title: string; description: string } | null;
  onClose: () => void;
  onChangeTitle: (title: string) => void;
  onChangeDescription: (description: string) => void;
  onSave: () => void;
}

export function EditNodeModal({
  node,
  onClose,
  onChangeTitle,
  onChangeDescription,
  onSave,
}: EditNodeModalProps) {
  if (!node) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <h4 className="text-base font-bold text-zinc-950">Edit Whiteboard Node</h4>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-black hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Node Title
            </label>
            <input
              type="text"
              value={node.title}
              onChange={(e) => onChangeTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-black font-semibold caret-black"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={node.description}
              onChange={(e) => onChangeDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-black leading-relaxed caret-black"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 shadow-sm cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
