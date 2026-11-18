import { Calendar, Code2, Edit3, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`pb-5 border-b flex flex-wrap items-center justify-between gap-3 text-sm ${
          isDark ? 'border-[#242321] text-[#A6A4A0]' : 'border-[#E8E1D5] text-[#6B665E]'
        }`}
      >
        <div className="flex items-center gap-2 font-medium">
          <Calendar className="w-4 h-4 opacity-70" />
          <span>Created {formatDate(project.created_at)}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            className={`inline-flex items-center gap-2 px-4 py-2 border text-sm font-semibold tracking-tight transition-colors cursor-pointer ${
              isDark
                ? 'border-[#242321] bg-[#111215] text-[#F5F3EF] hover:border-[#FFC900]/50 hover:bg-[#18191D]'
                : 'border-[#E8E1D5] bg-white text-[#171717] hover:border-[#D9A300]/50 hover:bg-[#F5EFE6]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`inline-flex items-center gap-2 px-4 py-2 border text-sm font-semibold tracking-tight transition-colors cursor-pointer ${
              isDark
                ? 'border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 hover:border-rose-700/60'
                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div
        className={`border p-6 sm:p-7 space-y-3 ${
          isDark ? 'border-[#242321] bg-[#111215]' : 'border-[#E8E1D5] bg-white'
        }`}
      >
        <span
          className={`text-xs sm:text-sm font-semibold uppercase tracking-wider block ${
            isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
          }`}
        >
          Description / Product Vision
        </span>
        <p
          className={`text-base font-normal leading-relaxed whitespace-pre-wrap ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          {project.description}
        </p>
      </div>

      {project.tech_stack && (
        <div
          className={`border p-6 sm:p-7 space-y-3.5 ${
            isDark ? 'border-[#242321] bg-[#111215]' : 'border-[#E8E1D5] bg-white'
          }`}
        >
          <span
            className={`text-xs sm:text-sm font-semibold uppercase tracking-wider block ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            Tech Stack
          </span>
          <div className="flex flex-wrap gap-2.5">
            {project.tech_stack
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tech, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 border text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-[#08090B] text-[#F5F3EF] border-[#242321]'
                      : 'bg-[#F7F3EA] text-[#171717] border-[#E8E1D5]'
                  }`}
                >
                  <Code2 className={`w-4 h-4 ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}`} />
                  <span>{tech}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {project.requirements && (
        <div
          className={`border p-6 sm:p-7 space-y-3.5 ${
            isDark ? 'border-[#242321] bg-[#111215]' : 'border-[#E8E1D5] bg-white'
          }`}
        >
          <span
            className={`text-xs sm:text-sm font-semibold uppercase tracking-wider block ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            Project Requirements
          </span>
          <div
            className={`p-5 border text-base font-normal leading-relaxed whitespace-pre-wrap ${
              isDark
                ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0]'
                : 'bg-[#F7F3EA]/50 border-[#E8E1D5] text-[#6B665E]'
            }`}
          >
            {project.requirements}
          </div>
        </div>
      )}

      <div
        className={`border p-6 sm:p-7 space-y-3.5 ${
          isDark ? 'border-[#242321] bg-[#111215]' : 'border-[#E8E1D5] bg-white'
        }`}
      >
        <span
          className={`text-xs sm:text-sm font-semibold uppercase tracking-wider block ${
            isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
          }`}
        >
          Update Project Status
        </span>
        <div className="flex flex-wrap gap-2.5">
          {(['Planning', 'In Progress', 'Completed'] as ProjectStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusChange(st)}
              className={`px-4 py-2 border text-sm font-semibold tracking-tight transition-all cursor-pointer ${
                project.status === st
                  ? isDark
                    ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900]'
                    : 'bg-[#D9A300] text-white border-[#D9A300]'
                  : isDark
                  ? 'bg-[#08090B] text-[#A6A4A0] border-[#242321] hover:text-[#F5F3EF] hover:border-[#FFC900]/50'
                  : 'bg-[#F7F3EA] text-[#6B665E] border-[#E8E1D5] hover:text-[#171717] hover:border-[#D9A300]/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
