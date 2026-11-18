import { useState } from 'react';
import { Code2, Check, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Task {
  id: string;
  text: string;
  done: boolean;
}

interface Preset {
  label: string;
  title: string;
  tech: string;
  phase1: Task[];
  phase2: Task[];
  phase3: Task[];
}

const PRESETS: Record<'saas' | 'mobile' | 'ai', Preset> = {
  saas: {
    label: 'SaaS Dashboard',
    title: 'DevOps AI Copilot Dashboard',
    tech: 'Next.js 15, TypeScript, Tailwind CSS, Supabase',
    phase1: [
      { id: 't1', text: 'System architecture & schema design', done: true },
      { id: 't2', text: 'Multi-tenant auth & role-based access', done: true },
    ],
    phase2: [
      { id: 't3', text: 'Telemetry stream ingestion pipeline', done: true },
      { id: 't4', text: 'AI anomaly detection agent', done: true },
      { id: 't5', text: 'Real-time alert webhooks & Slack integration', done: false },
    ],
    phase3: [
      { id: 't6', text: 'Production load testing & staging rollout', done: false },
    ],
  },
  mobile: {
    label: 'Mobile App',
    title: 'Cross-Platform Health Tracker',
    tech: 'React Native, Expo, Node.js, SQLite',
    phase1: [
      { id: 't1', text: 'Native Bluetooth sensor integrations', done: true },
      { id: 't2', text: 'Offline-first SQLite local sync', done: true },
    ],
    phase2: [
      { id: 't3', text: 'Daily biometric calculation engine', done: true },
      { id: 't4', text: 'Interactive charts with Victory Native', done: false },
      { id: 't5', text: 'Background sync worker setup', done: false },
    ],
    phase3: [
      { id: 't6', text: 'App Store & Google Play compliance checklist', done: false },
    ],
  },
  ai: {
    label: 'AI Agent',
    title: 'Autonomous Code Review Bot',
    tech: 'Python, FastAPI, LangGraph, GitHub Apps API',
    phase1: [
      { id: 't1', text: 'GitHub Webhook signature verification', done: true },
      { id: 't2', text: 'AST code chunking & diff analysis engine', done: true },
    ],
    phase2: [
      { id: 't3', text: 'Semantic security vulnerability scanner', done: true },
      { id: 't4', text: 'Automated inline PR review comments', done: true },
      { id: 't5', text: 'Custom team styleguide ingestion', done: false },
    ],
    phase3: [
      { id: 't6', text: 'Automated benchmark test suite in CI/CD', done: false },
    ],
  },
};

export function RoadmapSimulationSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedDemo, setSelectedDemo] = useState<'saas' | 'mobile' | 'ai'>('saas');
  const [tasksCompleted, setTasksCompleted] = useState<Record<string, boolean>>({
    t1: true,
    t2: true,
    t3: true,
    t4: true,
    t5: false,
    t6: false,
  });

  const toggleTask = (taskId: string) => {
    setTasksCompleted((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const currentPreset = PRESETS[selectedDemo];
  const totalTasks = 6;
  const currentCompletedCount = Object.values(tasksCompleted).filter(Boolean).length;
  const overallPercentage = Math.round((currentCompletedCount / totalTasks) * 100);

  return (
    <div id="demo" className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 mb-24">
      <div
        className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
          isDark
            ? 'border-[#242321] bg-[#08090B] shadow-2xl shadow-black/80'
            : 'border-[#E8E1D5] bg-[#FFFFFF] shadow-xl shadow-stone-200/50'
        }`}
      >
        <div
          className={`p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b transition-colors ${
            isDark
              ? 'bg-[#242321]/60 border-[#242321]'
              : 'bg-[#F7F3EA]/70 border-[#E8E1D5]'
          }`}
        >
          <div>
            <h3
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              Live Roadmap Simulation
            </h3>
            <p
              className={`text-xs sm:text-sm mt-1 ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              Select a project archetype to preview how DevPilot AI breaks down scope into execution.
            </p>
          </div>

          <div
            className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              isDark
                ? 'bg-[#08090B] border-[#242321]'
                : 'bg-[#FFFFFF] border-[#E8E1D5]'
            }`}
          >
            {(['saas', 'mobile', 'ai'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDemo(key)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedDemo === key
                    ? isDark
                      ? 'bg-[#FFC900] text-[#08090B] shadow-sm'
                      : 'bg-[#D9A300] text-white shadow-sm'
                    : isDark
                    ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                    : 'text-[#6B665E] hover:text-[#171717]'
                }`}
              >
                {PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 pb-6 border-b ${
              isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
            }`}
          >
            <div>
              <div
                className={`text-[11px] sm:text-sm font-bold uppercase tracking-widest mb-1 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Generated Architecture & Plan
              </div>
              <h4
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                {currentPreset.title}
              </h4>
              <div
                className={`text-xs sm:text-sm mt-1.5 flex items-center gap-2 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>
                  Tech Stack:{' '}
                  <strong className={isDark ? 'text-[#F5F3EF] font-semibold' : 'text-[#171717] font-semibold'}>
                    {currentPreset.tech}
                  </strong>
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <div className={`text-xs sm:text-sm font-semibold mb-0.5 ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}`}>
                Overall Progress
              </div>
              <div
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                }`}
              >
                {overallPercentage}%
              </div>
              <div className={`text-xs font-medium mt-0.5 ${isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}`}>
                {currentCompletedCount} of {totalTasks} milestones done
              </div>
            </div>
          </div>

          <div
            className={`w-full h-2.5 sm:h-3 rounded-full overflow-hidden mb-8 ${
              isDark ? 'bg-[#242321]' : 'bg-[#E8E1D5]'
            }`}
          >
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
              }`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div
              className={`border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors ${
                isDark
                  ? 'border-[#242321] bg-[#242321]/40'
                  : 'border-[#E8E1D5] bg-[#F7F3EA]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className={`text-[11px] sm:text-sm font-bold tracking-wider uppercase ${
                      isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                    }`}
                  >
                    Phase 01 • Architecture
                  </span>
                  <span
                    className={`text-[11px] sm:text-sm font-semibold px-2.5 py-0.5 rounded-md ${
                      isDark
                        ? 'bg-[#FFC900]/20 text-[#FFC900] border border-[#FFC900]/40'
                        : 'bg-[#D9A300]/15 text-[#D9A300] border border-[#D9A300]/30'
                    }`}
                  >
                    Done
                  </span>
                </div>
                <div className={`text-base sm:text-lg font-bold mb-3.5 ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                  Core Foundations
                </div>
                <div className="space-y-3">
                  {currentPreset.phase1.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-start gap-2.5 cursor-pointer select-none text-xs sm:text-sm leading-normal transition-colors ${
                        isDark
                          ? 'text-[#F5F3EF] hover:text-[#FFC900]'
                          : 'text-[#171717] hover:text-[#D9A300]'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          tasksCompleted[task.id]
                            ? isDark
                              ? 'bg-[#FFC900] border-[#FFC900] text-[#08090B]'
                              : 'bg-[#D9A300] border-[#D9A300] text-white'
                            : isDark
                            ? 'border-[#242321] bg-[#08090B]'
                            : 'border-[#E8E1D5] bg-[#FFFFFF]'
                        }`}
                      >
                        {tasksCompleted[task.id] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={tasksCompleted[task.id] ? (isDark ? 'line-through text-[#A6A4A0]' : 'line-through text-[#6B665E]') : ''}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors ${
                isDark
                  ? 'border-[#242321] bg-[#242321] shadow-xl shadow-black/40'
                  : 'border-[#E8E1D5] bg-[#FFFFFF] shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className={`text-[11px] sm:text-sm font-bold tracking-wider uppercase ${
                      isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                    }`}
                  >
                    Phase 02 • Core Features
                  </span>
                  <span
                    className={`text-[11px] sm:text-sm font-semibold px-2.5 py-0.5 rounded-md ${
                      isDark
                        ? 'bg-[#FFC900] text-[#08090B]'
                        : 'bg-[#D9A300] text-white'
                    }`}
                  >
                    In Flight
                  </span>
                </div>
                <div className={`text-base sm:text-lg font-bold mb-3.5 ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                  Feature Engineering
                </div>
                <div className="space-y-3">
                  {currentPreset.phase2.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-start gap-2.5 cursor-pointer select-none text-xs sm:text-sm leading-normal transition-colors ${
                        isDark
                          ? 'text-[#F5F3EF] hover:text-[#FFC900]'
                          : 'text-[#171717] hover:text-[#D9A300]'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          tasksCompleted[task.id]
                            ? isDark
                              ? 'bg-[#FFC900] border-[#FFC900] text-[#08090B]'
                              : 'bg-[#D9A300] border-[#D9A300] text-white'
                            : isDark
                            ? 'border-[#242321] bg-[#08090B]'
                            : 'border-[#E8E1D5] bg-[#FFFFFF]'
                        }`}
                      >
                        {tasksCompleted[task.id] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={tasksCompleted[task.id] ? (isDark ? 'line-through text-[#A6A4A0]' : 'line-through text-[#6B665E]') : ''}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors ${
                isDark
                  ? 'border-[#242321] bg-[#242321]/40'
                  : 'border-[#E8E1D5] bg-[#F7F3EA]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className={`text-[11px] sm:text-sm font-bold tracking-wider uppercase ${
                      isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                    }`}
                  >
                    Phase 03 • Deployment
                  </span>
                  <span
                    className={`text-[11px] sm:text-sm font-semibold px-2.5 py-0.5 rounded-md ${
                      isDark
                        ? 'bg-[#242321] text-[#A6A4A0] border border-[#242321]'
                        : 'bg-[#E8E1D5] text-[#6B665E]'
                    }`}
                  >
                    Queued
                  </span>
                </div>
                <div className={`text-base sm:text-lg font-bold mb-3.5 ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                  Rollout & Quality
                </div>
                <div className="space-y-3">
                  {currentPreset.phase3.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-start gap-2.5 cursor-pointer select-none text-xs sm:text-sm leading-normal transition-colors ${
                        isDark
                          ? 'text-[#F5F3EF] hover:text-[#FFC900]'
                          : 'text-[#171717] hover:text-[#D9A300]'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          tasksCompleted[task.id]
                            ? isDark
                              ? 'bg-[#FFC900] border-[#FFC900] text-[#08090B]'
                              : 'bg-[#D9A300] border-[#D9A300] text-white'
                            : isDark
                            ? 'border-[#242321] bg-[#08090B]'
                            : 'border-[#E8E1D5] bg-[#FFFFFF]'
                        }`}
                      >
                        {tasksCompleted[task.id] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={tasksCompleted[task.id] ? (isDark ? 'line-through text-[#A6A4A0]' : 'line-through text-[#6B665E]') : ''}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`mt-8 pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
            }`}
          >
            <div
              className={`text-xs sm:text-sm font-medium ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              <span>Click tasks to simulate real-time progress updates.</span>
            </div>
            <a
              href="#features"
              className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'text-[#F5F3EF] hover:text-[#FFC900]'
                  : 'text-[#171717] hover:text-[#D9A300]'
              }`}
            >
              <span>Explore All Features</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
