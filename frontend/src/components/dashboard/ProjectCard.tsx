import type { ReactNode } from 'react';
import {
  Calendar,
  Code2,
  Edit3,
  Trash2,
  Layers,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      onClick={() => onView(project)}
      className={`border p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] cursor-pointer ${
        isDark
          ? 'border-[#FFC900] bg-[#111215]'
          : 'border-[#D9A300] bg-[#FFFFFF]'
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              className={`text-base font-semibold tracking-tight line-clamp-1 ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              {project.name}
            </h3>
            <div
              className={`text-xs font-normal tracking-wider uppercase mt-1 ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              Roadmap Plan
            </div>
          </div>
          {renderStatusBadge(project.status)}
        </div>

        <p
          className={`text-sm line-clamp-2 leading-relaxed font-normal ${
            isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
          }`}
        >
          {project.description}
        </p>

        {project.tech_stack && (
          <div className="flex flex-wrap gap-2 pt-1">
            {project.tech_stack
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tech, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-sm font-normal ${
                    isDark
                      ? 'bg-[#08090B] text-[#A6A4A0] border-[#242321]'
                      : 'bg-[#F7F3EA] text-[#6B665E] border-[#E8E1D5]'
                  }`}
                >
                  <Code2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#FFC900]/70' : 'text-[#D9A300]/70'}`} />
                  {tech}
                </span>
              ))}
          </div>
        )}
      </div>

      <div
        className={`pt-5 border-t flex items-center justify-between mt-6 ${
          isDark ? 'border-[#242321] text-[#A6A4A0]' : 'border-[#E8E1D5] text-[#6B665E]'
        }`}
      >
        <div className="flex items-center gap-1.5 text-sm font-normal">
          <Calendar className="w-4 h-4 opacity-60" />
          <span>{formatDate(project.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Edit Project"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
            className={`p-2 border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:bg-stone-100'
            }`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Delete Project"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
            className={`p-2 border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] text-[#A6A4A0] hover:text-rose-400 hover:bg-rose-500/10'
                : 'border-[#E8E1D5] text-[#6B665E] hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onView(project)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 border text-sm font-semibold tracking-tight transition-colors cursor-pointer ml-1 ${
              isDark
                ? 'bg-[#18191D] text-[#F5F3EF] border-[#343330] hover:border-[#FFC900] hover:text-[#FFC900]'
                : 'bg-white text-[#171717] border-[#E8E1D5] hover:border-[#D9A300] hover:text-[#D9A300]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#FFC900]" />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
