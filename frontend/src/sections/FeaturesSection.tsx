import { ArrowRight, Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface FeaturesSectionProps {
  onNavigate?: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function FeaturesSection({ onNavigate }: FeaturesSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section
      id="features"
      className={`py-24 md:py-32 border-t border-b transition-colors duration-300 ${
        isDark ? 'bg-[#08090B] border-[#242321]' : 'bg-[#F7F3EA] border-[#E8E1D5]'
      }`}
    >
      <div className="w-full max-w-[1536px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-4 flex flex-col justify-between h-full pt-2">
            <div>
              <div className="mb-4">
                <span
                  className={`text-xs font-bold tracking-[0.2em] uppercase ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  CLEAR ARCHITECTURE
                </span>
              </div>
              <h3
                className={`text-xl sm:text-2xl font-bold leading-snug mb-3 ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                Get your full development roadmap in 30 seconds or less.
                <br />
                <span className={isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'}>
                  Make the right engineering move.
                </span>
              </h3>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => (onNavigate ? onNavigate('signup') : null)}
                className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold transition-all cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-[#FFC900] text-[#08090B] hover:bg-[#FFC900]/90 shadow-black/40'
                    : 'bg-[#D9A300] text-white hover:bg-[#D9A300]/90 shadow-stone-300'
                }`}
              >
                <span>Get your project roadmap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              <h2
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.14] mb-8 ${
                  isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                }`}
              >
                We cut out the{' '}
                <span
                  className={`px-2 py-0.5 rounded-lg inline-block ${
                    isDark
                      ? 'bg-[#FFC900]/20 text-[#FFC900]'
                      : 'bg-[#D9A300]/15 text-[#D9A300]'
                  }`}
                >
                  unnecessary steps
                </span>{' '}
                to make building your software{' '}
                <span
                  className={`px-2 py-0.5 rounded-lg inline-block ${
                    isDark
                      ? 'bg-[#FFC900]/20 text-[#FFC900]'
                      : 'bg-[#D9A300]/15 text-[#D9A300]'
                  }`}
                >
                  easy, fast, and stress-free.
                </span>
              </h2>

              <p
                className={`text-base sm:text-lg leading-relaxed font-normal mb-12 max-w-3xl ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                We structure software projects in any condition. From early concept sketches to
                multi-tenant cloud applications, our AI handles the heavy architectural
                decomposition. Get multi-phase plans, milestones, tech stack validation, and atomic PR-sized
                tasks with zero manual overhead. Ship on your timeline with total confidence.
              </p>
            </div>

            <div
              className={`pt-8 border-t grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 ${
                isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
              }`}
            >
              <div>
                <div
                  className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  Roadmaps Built
                </div>
                <div
                  className={`text-3xl sm:text-4xl font-black tracking-tight ${
                    isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                  }`}
                >
                  423+
                </div>
              </div>

              <div>
                <div
                  className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  Faster Planning
                </div>
                <div
                  className={`text-3xl sm:text-4xl font-black tracking-tight ${
                    isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                  }`}
                >
                  10x
                </div>
              </div>

              <div>
                <div
                  className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  Task Breakdown
                </div>
                <div
                  className={`text-3xl sm:text-4xl font-black tracking-tight ${
                    isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                  }`}
                >
                  100%
                </div>
              </div>

              <div>
                <div
                  className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                  }`}
                >
                  Developer Rating
                </div>
                <div
                  className={`text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-1.5 ${
                    isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
                  }`}
                >
                  <span>5.0</span>
                  <Star className={`w-5 h-5 fill-current ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
