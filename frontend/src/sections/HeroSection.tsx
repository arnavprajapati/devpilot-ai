import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onNavigate?: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden text-center">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#FF4055]/10 via-[#FF8A1C]/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-200 bg-white/80 backdrop-blur shadow-xs mb-8">
          <span className="w-2 h-2 rounded-full bg-[#FF4055] animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-zinc-800">
            AI-Powered Project Planning & Management
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-950 mb-6 leading-[1.12]">
          From Idea to{' '}
          <span className="relative inline-block group cursor-pointer select-none">
            <span className="bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent">
              Execution.
            </span>
            <span className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 sm:w-24 h-[3.5px] sm:h-[4px] rounded-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] group-hover:w-full transition-all duration-300 ease-out" />
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-600 leading-relaxed mb-10 font-normal">
          Turn your software ideas into actionable development plans with AI-powered roadmaps,
          organized tasks, and seamless progress tracking.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('signup') : null)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-black text-white text-base font-semibold hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg group cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-base font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-xs"
          >
            Explore Features
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-zinc-500 pt-2 border-t border-zinc-100 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FF4055]" />
            <span>AI Roadmap Generator</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FF4055]" />
            <span>Organized Task Breakdown</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FF4055]" />
            <span>Seamless Progress Tracking</span>
          </div>
        </div>
      </div>
    </section>
  );
}
