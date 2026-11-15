import { Calendar, Code2, Edit3, Trash2 } from 'lucide-react';
import type { Project, ProjectStatus } from '../../services/projectsApi';

interface ProjectSpecsViewProps {
  project: Project;
  formatDate: (dateString: string) => string;
  onStatusChange: (status: ProjectStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectSpecsView({
  project,
  formatDate,
  onStatusChange,
  onEdit,
  onDelete,
}: ProjectSpecsViewProps) {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
          Description / Product Vision
        </span>
        <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
          {project.description}
        </p>
      </div>

      {project.tech_stack && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Tech Stack
          </span>
          <div className="flex flex-wrap gap-2">
            {project.tech_stack
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tech, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-800 border border-zinc-200/60"
                >
                  <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                  {tech}
                </span>
              ))}
          </div>
        </div>
      )}

      {project.requirements && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Project Requirements
          </span>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed">
            {project.requirements}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
          Update Project Status
        </span>
        <div className="flex flex-wrap gap-2">
          {(['Planning', 'In Progress', 'Completed'] as ProjectStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusChange(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                project.status === st
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span>Created {formatDate(project.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
