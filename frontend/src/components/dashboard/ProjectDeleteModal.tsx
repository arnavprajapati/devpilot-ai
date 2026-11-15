import { Trash2 } from 'lucide-react';
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
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5" />
        </div>

        <h3 className="text-base font-bold text-zinc-950 mb-1">Delete Project</h3>
        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
          Are you sure you want to delete{' '}
          <strong className="text-zinc-800">"{project.name}"</strong>? This action
          cannot be undone.
        </p>

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
            disabled={isSubmitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && (
              <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
