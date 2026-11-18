import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!node) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`border shadow-2xl w-full max-w-md p-6 space-y-5 ${
          isDark
            ? 'border-[#242321] bg-[#18191D]'
            : 'border-[#E8E1D5] bg-white'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
          }`}
        >
          <h4
            className={`text-lg font-bold tracking-tight ${
              isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
            }`}
          >
            Edit Whiteboard Node
          </h4>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              Node Title
            </label>
            <input
              type="text"
              value={node.title}
              onChange={(e) => onChangeTitle(e.target.value)}
              className={`w-full px-4 py-2.5 border text-sm font-semibold focus:outline-none ${
                isDark
                  ? 'bg-[#08090B] border-[#242321] text-[#F5F3EF] focus:border-[#FFC900]'
                  : 'bg-white border-[#E8E1D5] text-[#171717] focus:border-[#D9A300]'
              }`}
            />
          </div>

          <div>
            <label
              className={`text-xs font-semibold uppercase tracking-wider block mb-1.5 ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              Description
            </label>
            <textarea
              rows={3}
              value={node.description}
              onChange={(e) => onChangeDescription(e.target.value)}
              className={`w-full px-4 py-2.5 border text-sm font-normal focus:outline-none leading-relaxed ${
                isDark
                  ? 'bg-[#08090B] border-[#242321] text-[#F5F3EF] focus:border-[#FFC900]'
                  : 'bg-white border-[#E8E1D5] text-[#171717] focus:border-[#D9A300]'
              }`}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
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
            onClick={onSave}
            className={`px-6 py-2.5 text-sm font-bold tracking-tight transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                : 'bg-[#D9A300] text-white hover:brightness-105'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
