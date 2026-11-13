import { useState } from 'react';
import { Code2, Check, ArrowRight } from 'lucide-react';

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
    <div id="demo" className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 mb-20">
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 overflow-hidden">
        <div className="bg-zinc-50/80 border-b border-zinc-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF4055]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                Live Roadmap Simulation
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select a project archetype to preview how DevPilot AI breaks down scope into execution.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-white border border-zinc-200 rounded-xl">
            {(['saas', 'mobile', 'ai'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDemo(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedDemo === key
                    ? 'bg-black text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Generated Architecture & Plan
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-zinc-950">
                {currentPreset.title}
              </h4>
              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  Tech Stack: <strong className="text-zinc-700 font-semibold">{currentPreset.tech}</strong>
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs font-bold text-zinc-500 mb-1">Overall Progress</div>
              <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent">
                {overallPercentage}%
              </div>
              <div className="text-xs text-zinc-400">
                {currentCompletedCount} of {totalTasks} milestones done
              </div>
            </div>
          </div>

          <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] transition-all duration-500 rounded-full"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wider uppercase text-zinc-500">
                    Phase 01 • Architecture
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-black text-white">
                    Done
                  </span>
                </div>
                <div className="text-sm font-bold text-zinc-900 mb-3">Core Foundations</div>
                <div className="space-y-2.5">
                  {currentPreset.phase1.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-zinc-700 hover:text-black transition-colors"
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          tasksCompleted[task.id]
                            ? 'bg-black border-black text-white'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {tasksCompleted[task.id] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={tasksCompleted[task.id] ? 'line-through text-zinc-400' : ''}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-zinc-200 rounded-xl p-5 bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wider uppercase text-zinc-500">
                    Phase 02 • Core Features
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] text-white">
                    In Flight
                  </span>
                </div>
                <div className="text-sm font-bold text-zinc-900 mb-3">Feature Engineering</div>
                <div className="space-y-2.5">
                  {currentPreset.phase2.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-zinc-700 hover:text-black transition-colors"
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          tasksCompleted[task.id]
                            ? 'bg-black border-black text-white'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {tasksCompleted[task.id] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={tasksCompleted[task.id] ? 'line-through text-zinc-400' : ''}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold tracking-wider uppercase text-zinc-500">
                    Phase 03 • Deployment
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700">
                    Queued
                  </span>
                </div>
                <div className="text-sm font-bold text-zinc-900 mb-3">Rollout & Quality</div>
                <div className="space-y-2.5">
                  {currentPreset.phase3.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-zinc-700 hover:text-black transition-colors"
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          tasksCompleted[task.id]
                            ? 'bg-black border-black text-white'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {tasksCompleted[task.id] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={tasksCompleted[task.id] ? 'line-through text-zinc-400' : ''}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4055]" />
              <span>Click tasks to simulate real-time progress updates.</span>
            </div>
            <a
              href="#features"
              className="text-xs font-bold text-black flex items-center gap-1 hover:text-[#FF4055] transition-colors"
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
