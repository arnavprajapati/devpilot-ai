import { Play, Lightbulb, Rocket } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeroSectionProps {
  onNavigate?: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleScrollToDemo = () => {
    const el = document.getElementById('how-it-works') || document.getElementById('features') || document.getElementById('demo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigate) {
      onNavigate('signup');
    }
  };

  const bgImage = isDark ? '/hero-bg-dark.png' : '/hero-bg-light.png';

  return (
    <section
      className={`relative min-h-[92vh] sm:min-h-screen w-full flex items-center overflow-hidden text-left transition-colors duration-300 ${
        isDark ? 'bg-[#08090B]' : 'bg-[#F7F3EA]'
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-[position:80%_top] sm:bg-[position:75%_top] md:bg-[position:70%_top] lg:bg-center transition-all duration-500"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />

      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-r from-[#08090B] via-[#08090B]/90 sm:via-[#08090B]/75 md:via-[#08090B]/50 to-transparent'
            : 'bg-gradient-to-r from-[#F7F3EA] via-[#F7F3EA]/90 sm:via-[#F7F3EA]/75 md:via-[#F7F3EA]/50 to-transparent'
        }`}
      />

      <div
        className={`absolute bottom-0 inset-x-0 h-28 pointer-events-none ${
          isDark
            ? 'bg-gradient-to-t from-[#08090B] via-[#08090B]/70 to-transparent'
            : 'bg-gradient-to-t from-[#F7F3EA] via-[#F7F3EA]/70 to-transparent'
        }`}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 flex flex-col justify-center">
        <div className="max-w-xl lg:max-w-2xl">
          <div className="flex items-center gap-3.5 mb-6 sm:mb-8">
            <span
              className={`text-xs sm:text-sm font-semibold tracking-[0.28em] uppercase transition-colors ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              IDEA • ARCHITECT • SHIP
            </span>
            <span
              className={`w-12 sm:w-16 h-[2px] rounded-full inline-block transition-colors ${
                isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
              }`}
            />
          </div>

          <h1
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-bold tracking-tight leading-[1.08] mb-6 transition-colors ${
              isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
            }`}
          >
            From Idea
            <br />
            to{' '}
            <span className="relative inline-block">
              <span className={isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}>
                Execution.
              </span>
              <span
                className={`absolute left-0 -bottom-1.5 w-full h-[3px] rounded-full ${
                  isDark ? 'bg-[#FFC900]' : 'bg-[#D9A300]'
                }`}
              />
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg md:text-xl font-normal leading-relaxed mb-10 max-w-lg transition-colors ${
              isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
            }`}
          >
            Architect full-stack roadmaps and manage software projects with AI.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={handleScrollToDemo}
              className="inline-flex items-center gap-3.5 group cursor-pointer select-none"
            >
              <span
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                  isDark
                    ? 'border border-white/20 bg-white/5 backdrop-blur-xs text-[#F5F3EF] group-hover:border-[#FFC900] group-hover:text-[#FFC900] group-hover:bg-[#FFC900]/15 group-hover:shadow-[0_0_22px_rgba(255,201,0,0.4)]'
                    : 'border border-[#E8E1D5] bg-[#FFFFFF] shadow-xs text-[#171717] group-hover:border-[#D9A300] group-hover:text-[#D9A300] group-hover:bg-[#D9A300]/10 group-hover:shadow-[0_0_22px_rgba(217,163,0,0.3)]'
                }`}
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </span>
              <span
                className={`font-medium text-base sm:text-lg transition-colors ${
                  isDark
                    ? 'text-[#F5F3EF] group-hover:text-[#FFC900]'
                    : 'text-[#171717] group-hover:text-[#D9A300]'
                }`}
              >
                See how it works
              </span>
            </button>
          </div>
        </div>

        <div className="hidden lg:block absolute right-[4%] xl:right-[8%] 2xl:right-[12%] top-[12%] xl:top-[8%] w-[480px] h-[390px] pointer-events-none select-none z-20">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 480 390" fill="none">
            <defs>
              <filter id="subtleWarmGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="circleHalo" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="halo" />
                <feMerge>
                  <feMergeNode in="halo" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M -40 295 C -5 295, 30 285, 65 265 C 105 245, 135 175, 160 125 C 195 80, 280 52, 370 48 C 415 46, 465 40, 510 32"
              stroke={isDark ? '#FFC900' : '#D9A300'}
              strokeWidth="2"
              strokeDasharray="5 7"
              strokeLinecap="round"
              strokeOpacity={isDark ? 0.9 : 0.85}
              filter="url(#subtleWarmGlow)"
            />

            <circle cx="13" cy="288" r="3" fill={isDark ? '#FFEAA0' : '#D9A300'} filter="url(#subtleWarmGlow)" />
            <circle cx="118" cy="206" r="3" fill={isDark ? '#FFEAA0' : '#D9A300'} filter="url(#subtleWarmGlow)" />
            <circle cx="265" cy="65" r="3" fill={isDark ? '#FFEAA0' : '#D9A300'} filter="url(#subtleWarmGlow)" />
            <circle cx="440" cy="42" r="3" fill={isDark ? '#FFEAA0' : '#D9A300'} filter="url(#subtleWarmGlow)" />

            <g transform="translate(65, 265)">
              <circle
                r="29"
                fill="none"
                stroke={isDark ? '#FFC900' : '#D9A300'}
                strokeWidth="1"
                strokeOpacity="0.25"
                filter="url(#circleHalo)"
              />
              <circle
                r="23"
                fill={isDark ? '#1C1610' : '#FFFFFF'}
                fillOpacity={isDark ? 0.85 : 0.95}
                stroke={isDark ? '#FFC900' : '#D9A300'}
                strokeWidth="1.75"
                filter="url(#subtleWarmGlow)"
              />
              <foreignObject x="-12" y="-12" width="24" height="24">
                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                  <Lightbulb className="w-4 h-4" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </g>

            <g transform="translate(160, 125)">
              <circle
                r="31"
                fill="none"
                stroke={isDark ? '#FFC900' : '#D9A300'}
                strokeWidth="1"
                strokeOpacity="0.25"
                filter="url(#circleHalo)"
              />
              <circle
                r="25"
                fill={isDark ? '#1C1610' : '#FFFFFF'}
                fillOpacity={isDark ? 0.85 : 0.95}
                stroke={isDark ? '#FFC900' : '#D9A300'}
                strokeWidth="1.75"
                filter="url(#subtleWarmGlow)"
              />
              <g stroke={isDark ? '#F5F3EF' : '#171717'} strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M -6 -5 L -11 0 L -6 5" strokeWidth="2" />
                <path d="M -2 6 L 2 -6" strokeWidth="1.75" />
                <path d="M 6 -5 L 11 0 L 6 5" strokeWidth="2" />
              </g>
            </g>

            <g transform="translate(370, 48)">
              <circle
                r="31"
                fill="none"
                stroke={isDark ? '#FFC900' : '#D9A300'}
                strokeWidth="1"
                strokeOpacity="0.25"
                filter="url(#circleHalo)"
              />
              <circle
                r="25"
                fill={isDark ? '#1C1610' : '#FFFFFF'}
                fillOpacity={isDark ? 0.85 : 0.95}
                stroke={isDark ? '#FFC900' : '#D9A300'}
                strokeWidth="1.75"
                filter="url(#subtleWarmGlow)"
              />
              <foreignObject x="-12" y="-12" width="24" height="24">
                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}>
                  <Rocket className="w-4 h-4" strokeWidth={1.75} />
                </div>
              </foreignObject>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
