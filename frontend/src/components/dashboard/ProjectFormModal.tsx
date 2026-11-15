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
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      <header className="h-20 shrink-0 border-b border-zinc-200 bg-white px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0">
            <FolderGit2 className="w-5 h-5 text-[#FF4055]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">
              {mode === 'create' ? 'Create New Project' : 'Edit Project'}
            </h2>
            <p className="text-xs text-zinc-500">
              {mode === 'create'
                ? 'Define your software project specifications, requirements, and tech stack.'
                : 'Update your project specifications, requirements, and tech stack.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </header>

      <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8">
          <div className="w-full max-w-5xl mx-auto space-y-8">
            {formError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Project Name <span className="text-[#FF4055]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. SmartTask AI, CloudOps Telemetry, DevPilot Engine"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors bg-white shadow-2xs"
                />
              </div>

              <div className="relative" ref={statusDropdownRef}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Project Status
                </label>
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 flex items-center justify-between hover:border-zinc-300 focus:outline-none focus:border-black transition-all cursor-pointer shadow-2xs"
                >
                  <span className="font-medium">{formStatus}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                      statusDropdownOpen ? 'rotate-180 text-black' : ''
                    }`}
                  />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white border border-zinc-200 rounded-2xl shadow-xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormStatus(opt.value);
                          setStatusDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer text-zinc-800"
                      >
                        <span
                          className={
                            formStatus === opt.value
                              ? 'font-bold text-black'
                              : 'font-normal'
                          }
                        >
                          {opt.label}
                        </span>
                        {formStatus === opt.value && (
                          <Check className="w-4 h-4 text-black stroke-[2.5]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
                Description / Project Idea <span className="text-[#FF4055]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe your software idea, primary goal, architectural intent, and user problem it solves..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors resize-y min-h-[110px] bg-white shadow-2xs leading-relaxed"
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                    Preferred Tech Stack
                  </label>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Add frameworks, languages, databases, or cloud tools. Click suggestions to attach them instantly.
                  </p>
                </div>

                <div className="text-xs text-zinc-400 font-medium">
                  {selectedTechs.length} added
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3 min-h-[52px] rounded-xl border border-zinc-200 bg-white focus-within:border-black transition-colors shadow-2xs">
                {selectedTechs.length === 0 && (
                  <span className="text-xs text-zinc-400 select-none">
                    No tech stack selected yet. Click from below or type custom...
                  </span>
                )}

                {selectedTechs.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-900 border border-zinc-200/80 animate-in fade-in zoom-in-90 duration-150"
                  >
                    <Code2 className="w-3 h-3 text-zinc-500" />
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => removeTechTag(tech)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-black transition-colors cursor-pointer ml-0.5"
                      title={`Remove ${tech}`}
                    >
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                  <input
                    type="text"
                    value={customTechInput}
                    onChange={(e) => setCustomTechInput(e.target.value)}
                    onKeyDown={handleCustomTechKeyDown}
                    placeholder="+ Type custom & press Enter"
                    className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent py-1"
                  />
                  {customTechInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        addTechTag(customTechInput);
                        setCustomTechInput('');
                      }}
                      className="px-2.5 py-1 rounded-md bg-black text-white text-[11px] font-semibold hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>

              {availableTechStacks && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('Popular')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                        activeCategory === 'Popular'
                          ? 'bg-black text-white shadow-2xs'
                          : 'bg-white border border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-300'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#FF4055]" />
                        Popular
                      </span>
                    </button>

                    {availableTechStacks.categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setActiveCategory(cat.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          activeCategory === cat.name
                            ? 'bg-black text-white shadow-2xs'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-300'
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-black text-white shadow-2xs border border-black'
                              : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-black'
                          }`}
                        >
                          <Code2
                            className={`w-3 h-3 ${
                              isSelected ? 'text-white' : 'text-zinc-400'
                            }`}
                          />
                          <span>{tech}</span>
                          {isSelected ? (
                            <X className="w-3 h-3 stroke-[3] ml-0.5" />
                          ) : (
                            <Plus className="w-3 h-3 text-zinc-400 stroke-[2.5] ml-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
                Project Requirements <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={4}
                value={formRequirements}
                onChange={(e) => setFormRequirements(e.target.value)}
                placeholder="List key engineering deliverables, constraints, third-party APIs (e.g. Stripe, AWS S3, OAuth), or milestones..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors resize-y min-h-[110px] bg-white shadow-2xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        <footer className="h-20 shrink-0 border-t border-zinc-200 bg-white px-6 sm:px-12 flex items-center justify-between">
          <p className="text-xs text-zinc-400 hidden sm:block">
            All changes are securely saved in your DevPilot AI database workspace.
          </p>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              <span>{mode === 'create' ? 'Create Project' : 'Save Changes'}</span>
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
