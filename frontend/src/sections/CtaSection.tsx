import { ArrowRight } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';

const GITHUB_REPO_URL = 'https://github.com';

interface CtaSectionProps {
  onNavigate?: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function CtaSection({ onNavigate }: CtaSectionProps) {
  return (
    <section className="py-16 w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12">
      <div className="rounded-3xl bg-black text-white p-8 sm:p-14 text-center relative overflow-hidden border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4055] to-[#FF8A1C]" />

        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Turn Your Idea into{' '}
            <span className="bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent">
              Execution?
            </span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mb-8 leading-relaxed font-normal">
            Join developers and teams who use DevPilot AI to plan, manage, and complete complex software
            projects with clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('signup') : null)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 font-semibold text-sm hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <GithubIcon className="w-4 h-4" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
