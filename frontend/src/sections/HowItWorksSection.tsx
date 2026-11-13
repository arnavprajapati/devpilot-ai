import { Terminal, Sparkles, ListTodo, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: 'Describe Your Idea',
    description:
      'Enter your project requirements, target features, and preferred technologies into the prompt bar.',
    icon: <Terminal className="w-4 h-4" />,
  },
  {
    number: '02',
    title: 'Generate Roadmap',
    description:
      'Let AI create a structured development plan with phases, architecture guidance, and timeframes.',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    number: '03',
    title: 'Manage Tasks',
    description:
      'Organize and complete development tasks broken down into manageable, atomic engineering issues.',
    icon: <ListTodo className="w-4 h-4" />,
  },
  {
    number: '04',
    title: 'Track Progress',
    description:
      'Monitor your journey from idea to completion with live milestone indicators and progress tracking.',
    icon: <TrendingUp className="w-4 h-4" />,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 mb-4">
            Your Idea,{' '}
            <span className="bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent">
              Our Roadmap.
            </span>
          </h2>
          <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] mx-auto mb-4" />
          <p className="text-base text-zinc-600 leading-relaxed font-normal">
            Four streamlined steps to transform your vision into an engineering plan ready for production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full items-stretch">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className="h-full flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-7 hover:border-zinc-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl font-black italic bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent">
                    {step.number}
                  </span>
                  <span className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-black group-hover:text-white transition-colors">
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-950 mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-100 text-xs font-semibold text-zinc-400">
                Step {idx + 1} of 4
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
