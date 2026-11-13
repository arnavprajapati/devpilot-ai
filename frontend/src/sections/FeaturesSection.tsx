import { Sparkles, FolderGit2, CheckSquare, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5 text-[#FF4055]" />,
    title: 'AI Roadmap Generator',
    description:
      'Generate structured development roadmaps based on project ideas and requirements. Input your vision, preferred tech stack, and timeline constraints to receive a multi-phase architectural plan.',
  },
  {
    icon: <FolderGit2 className="w-5 h-5 text-[#FF4055]" />,
    title: 'Project Management',
    description:
      'Create, organize, and manage multiple software projects in one workspace. Maintain context across repositories, microservices, and client apps without spreadsheet chaos.',
  },
  {
    icon: <CheckSquare className="w-5 h-5 text-[#FF4055]" />,
    title: 'Task Management',
    description:
      'Break projects into manageable tasks and track their completion. DevPilot AI breaks down massive milestones into atomic, actionable pull-request-sized engineering issues.',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-[#FF4055]" />,
    title: 'Progress Tracking',
    description:
      'Monitor project progress, completed tasks, and development milestones. Get live visibility into milestone completion rates, blocker alerts, and estimated shipping dates.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-zinc-50/50 border-t border-b border-zinc-100">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent">
              Build Smarter.
            </span>
          </h2>
          <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] mx-auto mb-4" />
          <p className="text-base text-zinc-600 leading-relaxed font-normal">
            Designed specifically for software engineers, tech leads, and founders to bridge the
            gap between abstract product ideas and deployable code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full items-stretch">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="h-full flex flex-col justify-start rounded-2xl border border-zinc-200 bg-white p-7 shadow-xs hover:shadow-lg hover:border-zinc-300 transition-all duration-300 group"
            >
              <div className="w-11 h-11 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2.5">{feature.title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed font-normal">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
