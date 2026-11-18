import { Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Project } from '../../services/projectsApi';

interface ProjectDeleteModalProps {
  isOpen: boolean;
  project: Project | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ProjectDeleteModal({
  isOpen,
  project,
  isSubmitting,
  onClose,
  onConfirm,
}: ProjectDeleteModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`border shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-center ${
          isDark
            ? 'border-[#242321] bg-[#18191D]'
            : 'border-[#E8E1D5] bg-white'
        }`}
      >
        <div
          className={`w-12 h-12 border flex items-center justify-center mx-auto mb-4 ${
            isDark
              ? 'bg-rose-950/20 text-rose-400 border-rose-900/40'
              : 'bg-red-50 text-red-500 border-red-200'
          }`}
        >
          <Trash2 className="w-5 h-5" />
        </div>

        <h3
          className={`text-lg font-bold mb-1 tracking-tight ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          Delete Project
        </h3>
        <p
          className={`text-sm mb-6 leading-relaxed font-normal ${
            isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
          }`}
        >
          Are you sure you want to delete{' '}
          <strong className={isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}>
            "{project.name}"
          </strong>
          ? This action cannot be undone.
        </p>

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
            disabled={isSubmitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-bold tracking-tight hover:bg-red-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin" />
            )}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
