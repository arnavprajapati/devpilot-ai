import { useState, useRef, useEffect } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import {
  FolderGit2,
  X,
  ChevronDown,
  Check,
  AlertCircle,
  Code2,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { ProjectStatus, TechStacksResponse } from '../../services/projectsApi';

interface ProjectFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formName: string;
  setFormName: (val: string) => void;
  formDescription: string;
  setFormDescription: (val: string) => void;
  formRequirements: string;
  setFormRequirements: (val: string) => void;
  formStatus: ProjectStatus;
  setFormStatus: (val: ProjectStatus) => void;
  selectedTechs: string[];
  addTechTag: (tech: string) => void;
  removeTechTag: (tech: string) => void;
  availableTechStacks: TechStacksResponse | null;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

const statusOptions: { label: string; value: ProjectStatus }[] = [
  { label: 'Planning', value: 'Planning' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
];

export function ProjectFormModal({
  isOpen,
  mode,
  formName,
  setFormName,
  formDescription,
  setFormDescription,
  formRequirements,
  setFormRequirements,
  formStatus,
  setFormStatus,
  selectedTechs,
  addTechTag,
  removeTechTag,
  availableTechStacks,
  formError,
  isSubmitting,
  onSubmit,
  onClose,
}: ProjectFormModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeCategory, setActiveCategory] = useState<string>('Popular');
  const [customTechInput, setCustomTechInput] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomTechKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (customTechInput.trim()) {
        addTechTag(customTechInput);
        setCustomTechInput('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif] ${
        isDark ? 'bg-[#08090B] text-[#F5F3EF]' : 'bg-[#FFFFFF] text-[#171717]'
      }`}
    >
      <header
        className={`h-22 sm:h-24 shrink-0 border-b px-6 sm:px-12 flex items-center justify-between ${
          isDark
            ? 'bg-[#08090B] border-[#242321]'
            : 'bg-[#FFFFFF] border-[#E8E1D5]'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-11 h-11 border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-[#18191D] border-[#242321] text-[#FFC900]'
                : 'bg-[#F7F3EA] border-[#E8E1D5] text-[#D9A300]'
            }`}
          >
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              {mode === 'create' ? 'Create New Project' : 'Edit Project'}
            </h2>
            <p
              className={`text-sm mt-0.5 font-normal ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              {mode === 'create'
                ? 'Define your software project specifications, requirements, and tech stack.'
                : 'Update your project specifications, requirements, and tech stack.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`px-4 py-2 border transition-colors cursor-pointer flex items-center gap-2 text-sm font-semibold tracking-tight ${
            isDark
              ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:border-[#FFC900]/50 bg-[#18191D]'
              : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:border-[#D9A300]/50 bg-white'
          }`}
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </header>

      <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 sm:px-12 py-8">
          <div className="w-full max-w-5xl mx-auto space-y-8">
            {formError && (
              <div
                className={`p-4 border text-sm flex items-center gap-3 ${
                  isDark
                    ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2">
                <label
                  className={`block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  Project Name{' '}
                  <span className={isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. SmartTask AI, CloudOps Telemetry, DevPilot Engine"
                  className={`w-full px-4 py-3 border text-base font-normal focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] placeholder:text-[#A6A4A0]/50 focus:border-[#FFC900]'
                      : 'bg-white border-[#E8E1D5] text-[#171717] placeholder:text-[#6B665E]/50 focus:border-[#D9A300]'
                  }`}
                />
              </div>

              <div className="relative" ref={statusDropdownRef}>
                <label
                  className={`block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  Project Status
                </label>
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={`w-full px-4 py-3 border text-base font-normal flex items-center justify-between focus:outline-none transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] hover:border-[#FFC900]/40 focus:border-[#FFC900]'
                      : 'bg-white border-[#E8E1D5] text-[#171717] hover:border-[#D9A300]/40 focus:border-[#D9A300]'
                  }`}
                >
                  <span>{formStatus}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      statusDropdownOpen ? 'rotate-180' : ''
                    } ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}`}
                  />
                </button>

                {statusDropdownOpen && (
                  <div
                    className={`absolute top-full left-0 right-0 mt-1.5 z-30 border shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                      isDark
                        ? 'bg-[#18191D] border-[#242321]'
                        : 'bg-white border-[#E8E1D5]'
                    }`}
                  >
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormStatus(opt.value);
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                          isDark
                            ? 'text-[#F5F3EF] hover:bg-[#242321]'
                            : 'text-[#171717] hover:bg-[#F7F3EA]'
                        }`}
                      >
                        <span
                          className={
                            formStatus === opt.value
                              ? `font-bold ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}`
                              : 'font-normal'
                          }
                        >
                          {opt.label}
                        </span>
                        {formStatus === opt.value && (
                          <Check
                            className={`w-4 h-4 stroke-[2.5] ${
                              isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                className={`block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Description / Project Idea{' '}
                <span className={isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}>*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe your software idea, primary goal, architectural intent, and user problem it solves..."
                className={`w-full px-4 py-3 border text-base font-normal focus:outline-none transition-colors resize-y min-h-[120px] leading-relaxed ${
                  isDark
                    ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] placeholder:text-[#A6A4A0]/50 focus:border-[#FFC900]'
                    : 'bg-white border-[#E8E1D5] text-[#171717] placeholder:text-[#6B665E]/50 focus:border-[#D9A300]'
                }`}
              />
            </div>

            <div
              className={`border p-6 sm:p-7 space-y-4 ${
                isDark ? 'border-[#242321] bg-[#111215]' : 'border-[#E8E1D5] bg-[#F7F3EA]/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                      isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                    }`}
                  >
                    Preferred Tech Stack
                  </label>
                  <p
                    className={`text-sm mt-0.5 font-normal ${
                      isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                    }`}
                  >
                    Add frameworks, languages, databases, or cloud tools. Click suggestions to attach them instantly.
                  </p>
                </div>

                <div
                  className={`text-sm font-medium ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  {selectedTechs.length} added
                </div>
              </div>

              <div
                className={`flex flex-wrap items-center gap-2 p-3 min-h-[56px] border focus-within:border-current transition-colors ${
                  isDark
                    ? 'bg-[#08090B] border-[#242321] focus-within:border-[#FFC900]'
                    : 'bg-white border-[#E8E1D5] focus-within:border-[#D9A300]'
                }`}
              >
                {selectedTechs.length === 0 && (
                  <span
                    className={`text-sm select-none ${
                      isDark ? 'text-[#A6A4A0]/50' : 'text-[#6B665E]/50'
                    }`}
                  >
                    No tech stack selected yet. Click from below or type custom...
                  </span>
                )}

                {selectedTechs.map((tech) => (
                  <span
                    key={tech}
                    className={`inline-flex items-center gap-2 pl-3 pr-2 py-1.5 border text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-[#18191D] text-[#F5F3EF] border-[#242321]'
                        : 'bg-[#F7F3EA] text-[#171717] border-[#E8E1D5]'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 opacity-70" />
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => removeTechTag(tech)}
                      className={`w-4 h-4 flex items-center justify-center transition-colors cursor-pointer ml-1 ${
                        isDark
                          ? 'text-[#A6A4A0] hover:text-[#08090B] hover:bg-[#FFC900]'
                          : 'text-[#6B665E] hover:text-white hover:bg-black'
                      }`}
                      title={`Remove ${tech}`}
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <input
                    type="text"
                    value={customTechInput}
                    onChange={(e) => setCustomTechInput(e.target.value)}
                    onKeyDown={handleCustomTechKeyDown}
                    placeholder="+ Type custom & press Enter"
                    className={`w-full text-sm font-normal focus:outline-none bg-transparent py-1 ${
                      isDark
                        ? 'text-[#F5F3EF] placeholder:text-[#A6A4A0]/50'
                        : 'text-[#171717] placeholder:text-[#6B665E]/50'
                    }`}
                  />
                  {customTechInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        addTechTag(customTechInput);
                        setCustomTechInput('');
                      }}
                      className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        isDark
                          ? 'bg-[#FFC900] text-[#08090B] hover:brightness-110'
                          : 'bg-[#D9A300] text-white hover:brightness-105'
                      }`}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>

              {availableTechStacks && (
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('Popular')}
                      className={`px-3.5 py-1.5 border text-sm font-semibold tracking-tight transition-all cursor-pointer shrink-0 ${
                        activeCategory === 'Popular'
                          ? isDark
                            ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900]'
                            : 'bg-[#D9A300] text-white border-[#D9A300]'
                          : isDark
                          ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF]'
                          : 'bg-white border-[#E8E1D5] text-[#6B665E] hover:text-[#171717]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles
                          className={`w-3.5 h-3.5 ${
                            activeCategory === 'Popular'
                              ? isDark
                                ? 'text-[#08090B]'
                                : 'text-white'
                              : isDark
                              ? 'text-[#FFC900]'
                              : 'text-[#D9A300]'
                          }`}
                        />
                        Popular
                      </span>
                    </button>

                    {availableTechStacks.categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setActiveCategory(cat.name)}
                        className={`px-3.5 py-1.5 border text-sm font-semibold tracking-tight transition-all cursor-pointer shrink-0 ${
                          activeCategory === cat.name
                            ? isDark
                              ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900]'
                              : 'bg-[#D9A300] text-white border-[#D9A300]'
                            : isDark
                            ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF]'
                            : 'bg-white border-[#E8E1D5] text-[#6B665E] hover:text-[#171717]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(activeCategory === 'Popular'
                      ? availableTechStacks.popular
                      : availableTechStacks.categories.find(
                          (c) => c.name === activeCategory
                        )?.items || []
                    ).map((tech) => {
                      const isSelected = selectedTechs.some(
                        (t) => t.toLowerCase() === tech.toLowerCase()
                      );
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() =>
                            isSelected ? removeTechTag(tech) : addTechTag(tech)
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                            isSelected
                              ? isDark
                                ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900]'
                                : 'bg-[#D9A300] text-white border-[#D9A300]'
                              : isDark
                              ? 'bg-[#08090B] border-[#242321] text-[#A6A4A0] hover:border-[#FFC900]/40 hover:text-[#F5F3EF]'
                              : 'bg-white border-[#E8E1D5] text-[#6B665E] hover:border-[#D9A300]/40 hover:text-[#171717]'
                          }`}
                        >
                          <Code2 className="w-3 h-3 opacity-60" />
                          <span>{tech}</span>
                          {isSelected ? (
                            <X className="w-3.5 h-3.5 stroke-[3] ml-0.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 opacity-60 stroke-[2.5] ml-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                className={`block text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Project Requirements{' '}
                <span className="opacity-60 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={4}
                value={formRequirements}
                onChange={(e) => setFormRequirements(e.target.value)}
                placeholder="List key engineering deliverables, constraints, third-party APIs (e.g. Stripe, AWS S3, OAuth), or milestones..."
                className={`w-full px-4 py-3 border text-base font-normal focus:outline-none transition-colors resize-y min-h-[120px] leading-relaxed ${
                  isDark
                    ? 'bg-[#18191D] border-[#242321] text-[#F5F3EF] placeholder:text-[#A6A4A0]/50 focus:border-[#FFC900]'
                    : 'bg-white border-[#E8E1D5] text-[#171717] placeholder:text-[#6B665E]/50 focus:border-[#D9A300]'
                }`}
              />
            </div>
          </div>
        </div>

        <footer
          className={`h-22 sm:h-24 shrink-0 border-t px-6 sm:px-12 flex items-center justify-between ${
            isDark
              ? 'bg-[#08090B] border-[#242321]'
              : 'bg-[#FFFFFF] border-[#E8E1D5]'
          }`}
        >
          <p
            className={`text-sm font-normal hidden sm:block ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            All changes are securely saved in your DevPilot AI database workspace.
          </p>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 border text-sm font-semibold tracking-tight transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#242321] text-[#A6A4A0] hover:text-[#F5F3EF] hover:border-[#FFC900]/50 bg-[#18191D]'
                  : 'border-[#E8E1D5] text-[#6B665E] hover:text-[#171717] hover:border-[#D9A300]/50 bg-white'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-6 py-2.5 border text-sm font-bold tracking-tight transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                isDark
                  ? 'bg-[#FFC900] text-[#08090B] border-[#FFC900] hover:brightness-110'
                  : 'bg-[#D9A300] text-white border-[#D9A300] hover:brightness-105'
              }`}
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
              )}
              <span>{mode === 'create' ? 'Create Project' : 'Save Changes'}</span>
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
