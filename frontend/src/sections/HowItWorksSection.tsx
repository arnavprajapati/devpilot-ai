import { useState } from 'react';
import { Plus, Minus, ArrowRight, Code2, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface StepItem {
  number: string;
  title: string;
  url: string;
  tabTitle: string;
  description: string;
  bullets: string[];
  linkText: string;
  preview: {
    badge: string;
    headline: string;
    meta: string;
    items: { label: string; detail: string; done?: boolean }[];
  };
}

const STEPS: StepItem[] = [
  {
    number: '01',
    title: 'Describe Your Vision',
    url: 'https://devpilot.ai/scope',
    tabTitle: 'DevPilot AI — Scope',
    description:
      'Transform high-level product briefs and raw ideas into structured engineering requirements. DevPilot AI parses technical goals, constraints, and target architectures.',
    bullets: [
      'Natural language technical scope decomposition',
      'Recommended architecture & framework stack',
      'MVP boundary and milestone identification',
      'Target performance, security, and scaling parameters',
      'Elimination of ambiguous technical specifications',
    ],
    linkText: 'Explore project initialization',
    preview: {
      badge: 'Step 01 • Ingestion',
      headline: 'Next-Gen Developer Workspace',
      meta: 'Target Stack: React, FastAPI, PostgreSQL, Redis',
      items: [
        { label: 'Scope Ingestion', detail: 'Decomposed 4 core user flows into technical specs', done: true },
        { label: 'Stack Evaluation', detail: 'Selected high-concurrency microservice baseline', done: true },
        { label: 'Data Boundary', detail: 'Identified relational & cache storage requirements', done: true },
      ],
    },
  },
  {
    number: '02',
    title: 'Architect Roadmap',
    url: 'https://devpilot.ai/roadmap',
    tabTitle: 'DevPilot AI — Architecture',
    description:
      'AI decomposes requirements into sequenced phases, milestones, technical dependencies, and realistic timeframes. Every task is structured as atomic, PR-sized engineering work.',
    bullets: [
      'Multi-phase architecture & schema generation',
      'Critical path and dependency tree calculation',
      'Granular task breakdown with acceptance criteria',
      'Automated milestone timeline estimation',
      'Third-party service & API integration mapping',
      'Elimination of spreadsheet and task chaos',
    ],
    linkText: 'Explore roadmap generation',
    preview: {
      badge: 'Step 02 • Decomposition',
      headline: 'DevOps Copilot Architecture',
      meta: '3 Sequenced Phases • 12 Milestones • 100% Dependency Mapped',
      items: [
        { label: 'Phase 01: Core Foundations', detail: 'Multi-tenant auth, database schema, state machine', done: true },
        { label: 'Phase 02: Ingestion & Pipelines', detail: 'Real-time telemetry streams, webhook routing', done: true },
        { label: 'Phase 03: Deployment & Rollout', detail: 'Staging automated tests, zero-downtime deploy', done: false },
      ],
    },
  },
  {
    number: '03',
    title: 'Interactive Canvas',
    url: 'https://devpilot.ai/whiteboard',
    tabTitle: 'DevPilot AI — Canvas',
    description:
      'Visualise the entire development flow on an infinite node-based whiteboard. Drag, connect, and inspect phases with real-time dependency lines and auto-layout flexibility.',
    bullets: [
      'Interactive node-based visual roadmap whiteboard',
      'Draggable phase cards with live milestone statuses',
      'Dynamic dependency connector curves and edge routing',
      'Minimap navigation, zoom, and node grouping controls',
      'Real-time schema and architecture state persistence',
    ],
    linkText: 'Explore interactive whiteboard',
    preview: {
      badge: 'Step 03 • Visual Flow',
      headline: 'Node Architecture Whiteboard',
      meta: 'Interactive React Flow Engine • Auto-Layout Enabled',
      items: [
        { label: 'Node: Frontend Client', detail: 'Connected to API Gateway via REST & WebSocket', done: true },
        { label: 'Node: AI Engine Service', detail: 'Orchestrates Gemini roadmap & task generators', done: true },
        { label: 'Node: Distributed Workers', detail: 'Executes async background telemetry workers', done: true },
      ],
    },
  },
  {
    number: '04',
    title: 'Execute & Ship',
    url: 'https://devpilot.ai/execution',
    tabTitle: 'DevPilot AI — Production',
    description:
      'Track real-time milestone progress, update task status, and maintain clean project documentation from initial commit all the way to staging and production.',
    bullets: [
      'Real-time task completion percentage tracking',
      'Interactive task simulation with immediate status updates',
      'Production quality checklist and audit readiness',
      'Atomic milestone verification before final release',
      'Clear context preservation across entire engineering lifecycle',
    ],
    linkText: 'Explore execution tracking',
    preview: {
      badge: 'Step 04 • Production Delivery',
      headline: 'Milestone Execution & Quality Gate',
      meta: 'Overall Progress: 67% • 4 of 6 Milestones Completed',
      items: [
        { label: 'Milestone 01', detail: 'System architecture & schema design — Complete', done: true },
        { label: 'Milestone 02', detail: 'Telemetry stream ingestion pipeline — In Flight', done: true },
        { label: 'Milestone 03', detail: 'Production load testing & staging rollout — Queued', done: false },
      ],
    },
  },
];

interface HowItWorksSectionProps {
  onNavigate?: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function HowItWorksSection({ onNavigate }: HowItWorksSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedIndex, setExpandedIndex] = useState<number>(1);

  const toggleStep = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? -1 : idx);
  };

  const handleAction = () => {
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigate) {
      onNavigate('signup');
    }
  };

  return (
    <section
      id="how-it-works"
      className={`py-20 md:py-28 transition-colors duration-300 ${
        isDark ? 'bg-[#08090B]' : 'bg-[#F7F3EA]'
      }`}
    >
      <div className="w-full max-w-[1536px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl mb-14">
          <div className="mb-3">
            <span
              className={`text-xs font-bold tracking-[0.2em] uppercase ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              EXECUTION PIPELINE
            </span>
          </div>
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 ${
              isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
            }`}
          >
            From blank canvas to deployable software in{' '}
            <span className={isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}>
              four steps.
            </span>
          </h2>
          <p
            className={`text-base sm:text-lg leading-relaxed font-normal ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            A streamlined framework to transform ambiguous product ideas into structured, production-ready engineering milestones.
          </p>
        </div>

        <div className={`border-t ${isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'}`}>
          {STEPS.map((step, idx) => {
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={step.number}
                className={`border-b transition-colors ${
                  isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className="w-full py-7 sm:py-9 flex items-center justify-between text-left cursor-pointer group focus:outline-none"
                >
                  <div className="flex items-center gap-6 sm:gap-10">
                    <span
                      className={`text-2xl sm:text-3xl font-semibold tracking-tight transition-colors ${
                        isExpanded
                          ? isDark
                            ? 'text-[#FFC900]'
                            : 'text-[#D9A300]'
                          : isDark
                          ? 'text-[#A6A4A0] group-hover:text-[#F5F3EF]'
                          : 'text-[#6B665E] group-hover:text-[#171717]'
                      }`}
                    >
                      {step.number}
                    </span>
                    <h3
                      className={`text-xl sm:text-2xl font-semibold tracking-tight transition-colors ${
                        isExpanded
                          ? isDark
                            ? 'text-[#F5F3EF]'
                            : 'text-[#171717]'
                          : isDark
                          ? 'text-[#F5F3EF]/90 group-hover:text-[#F5F3EF]'
                          : 'text-[#171717]/90 group-hover:text-[#171717]'
                      }`}
                    >
                      {step.title}
                    </h3>
                  </div>

                  <span
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
                      isExpanded
                        ? isDark
                          ? 'bg-[#FFC900] text-[#08090B]'
                          : 'bg-[#D9A300] text-white'
                        : isDark
                        ? 'border border-[#242321] text-[#A6A4A0] group-hover:border-[#FFC900]/60 group-hover:text-[#FFC900]'
                        : 'border border-[#E8E1D5] bg-[#FFFFFF] text-[#6B665E] group-hover:border-[#D9A300]/60 group-hover:text-[#D9A300]'
                    }`}
                  >
                    {isExpanded ? (
                      <Minus className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </span>
                </button>

                {isExpanded && (
                  <div className="pb-10 sm:pb-14 pt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                      <div className="lg:col-span-7">
                        <div
                          className={`rounded-2xl border overflow-hidden shadow-xl transition-all ${
                            isDark
                              ? 'border-[#242321] bg-[#121316] shadow-black/80'
                              : 'border-[#E8E1D5] bg-[#FFFFFF] shadow-stone-200/60'
                          }`}
                        >
                          <div
                            className={`px-4 py-3 border-b flex items-center gap-3 ${
                              isDark
                                ? 'bg-[#18191D] border-[#242321]'
                                : 'bg-[#F2ECE1] border-[#E8E1D5]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block" />
                            </div>

                            <div
                              className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono grow max-w-sm ${
                                isDark
                                  ? 'bg-[#08090B] text-[#A6A4A0] border border-[#242321]'
                                  : 'bg-[#FFFFFF] text-[#6B665E] border border-[#E8E1D5]'
                              }`}
                            >
                              <Code2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{step.url}</span>
                            </div>
                          </div>

                          <div className="p-6 sm:p-7">
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                  isDark
                                    ? 'bg-[#FFC900]/15 text-[#FFC900] border border-[#FFC900]/30'
                                    : 'bg-[#D9A300]/15 text-[#D9A300] border border-[#D9A300]/30'
                                }`}
                              >
                                {step.preview.badge}
                              </span>
                              <span
                                className={`text-xs font-normal font-mono ${
                                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                }`}
                              >
                                v2.4 • active
                              </span>
                            </div>

                            <h4
                              className={`text-base sm:text-lg font-semibold tracking-tight mb-1 ${
                                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                              }`}
                            >
                              {step.preview.headline}
                            </h4>
                            <p
                              className={`text-sm font-normal mb-5 ${
                                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                              }`}
                            >
                              {step.preview.meta}
                            </p>

                            <div className="space-y-2.5">
                              {step.preview.items.map((item, itemIdx) => (
                                <div
                                  key={itemIdx}
                                  className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                                    isDark
                                      ? 'bg-[#18191D] border-[#242321]'
                                      : 'bg-[#F9F7F1] border-[#E8E1D5]'
                                  }`}
                                >
                                  <div
                                    className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                      item.done
                                        ? isDark
                                          ? 'bg-[#FFC900] text-[#08090B]'
                                          : 'bg-[#D9A300] text-white'
                                        : isDark
                                        ? 'border border-[#242321] text-transparent'
                                        : 'border border-[#E8E1D5] text-transparent'
                                    }`}
                                  >
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                  <div className="grow min-w-0">
                                    <div
                                      className={`text-sm font-semibold ${
                                        isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                                      }`}
                                    >
                                      {item.label}
                                    </div>
                                    <div
                                      className={`text-sm font-normal mt-0.5 truncate ${
                                        isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                      }`}
                                    >
                                      {item.detail}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5 flex flex-col justify-between pt-1">
                        <div>
                          <p
                            className={`text-base leading-relaxed font-normal mb-6 ${
                              isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                            }`}
                          >
                            {step.description}
                          </p>

                          <ul className="space-y-3 mb-8">
                            {step.bullets.map((bullet, bIdx) => (
                              <li
                                key={bIdx}
                                className={`flex items-start gap-2.5 text-base font-normal leading-relaxed ${
                                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                                }`}
                              >
                                <span
                                  className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
                                  }`}
                                />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={handleAction}
                            className={`inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 cursor-pointer transition-colors ${
                              isDark
                                ? 'text-[#FFC900] hover:text-[#FFC900]/80'
                                : 'text-[#D9A300] hover:text-[#D9A300]/80'
                            }`}
                          >
                            <span>{step.linkText}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}