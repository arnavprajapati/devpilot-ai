import type { ReactNode } from 'react';
import {
  Calendar,
  Code2,
  Edit3,
  Trash2,
  Layers,
} from 'lucide-react';
import type { Project, ProjectStatus } from '../../services/projectsApi';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onView: (project: Project) => void;
  formatDate: (dateString: string) => string;
  renderStatusBadge: (status: ProjectStatus) => ReactNode;
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onView,
  formatDate,
  renderStatusBadge,
}: ProjectCardProps) {
  return (
    <div className="group rounded-2xl border border-zinc-200/90 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-950 group-hover:text-black transition-colors line-clamp-1">
              {project.name}
            </h3>
            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
              Roadmap Plan
            </div>
          </div>
          {renderStatusBadge(project.status)}
        </div>

        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {project.tech_stack && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.tech_stack
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tech, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100/80 text-[11px] font-medium text-zinc-600 border border-zinc-200/50"
                >
                  <Code2 className="w-3 h-3 text-zinc-400" />
                  {tech}
                </span>
              ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400 mt-5">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span>{formatDate(project.created_at)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Edit Project"
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Delete Project"
            onClick={() => onDelete(project)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onView(project)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer ml-1 shadow-2xs"
          >
            <span>View</span>
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
