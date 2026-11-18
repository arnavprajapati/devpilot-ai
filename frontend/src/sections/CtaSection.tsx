import { ArrowRight } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { useTheme } from '../context/ThemeContext';

const GITHUB_REPO_URL = 'https://github.com/arnavprajapati';

interface CtaSectionProps {
  onNavigate?: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function CtaSection({ onNavigate }: CtaSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="py-16 w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12">
      <div
        className={`rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden border transition-all duration-300 ${
          isDark
            ? 'bg-[#242321] text-[#F5F3EF] border-[#242321] shadow-2xl shadow-black/80'
            : 'bg-[#FFFFFF] text-[#171717] border-[#E8E1D5] shadow-xl shadow-stone-200/50'
        }`}
      >
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
          }`}
        />

        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Turn Your Idea into{' '}
            <span className={isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}>
              Execution?
            </span>
          </h2>
          <p
            className={`text-sm sm:text-base mb-8 leading-relaxed font-normal ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            Join developers and teams who use DevPilot AI to plan, manage, and complete complex software
            projects with clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => (onNavigate ? onNavigate('signup') : null)}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#FFC900] text-[#08090B] hover:bg-[#FFC900]/90 shadow-black/30'
                  : 'bg-[#D9A300] text-white hover:bg-[#D9A300]/90 shadow-stone-300'
              }`}
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className={`w-full sm:w-auto px-8 py-3.5 rounded-full border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'border-[#08090B] bg-[#08090B] text-[#F5F3EF] hover:border-[#FFC900]/60'
                  : 'border-[#E8E1D5] bg-[#F7F3EA] text-[#171717] hover:border-[#D9A300]/60 hover:bg-[#FFFFFF]'
              }`}
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
