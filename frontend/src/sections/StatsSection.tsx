import { useTheme } from '../context/ThemeContext';

const STATS = [
  { value: '10x', label: 'Faster Roadmap Planning' },
  { value: '100%', label: 'AI-Structured Roadmaps' },
  { value: '4-Phase', label: 'Execution Framework' },
  { value: 'Zero', label: 'Manual Roadmap Overhead' },
];

export function StatsSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 mb-24">
      <div
        className={`rounded-2xl p-8 sm:p-10 border transition-all duration-300 ${
          isDark
            ? 'bg-[#242321] border-[#242321] shadow-2xl shadow-black/80 text-[#F5F3EF]'
            : 'bg-[#FFFFFF] border-[#E8E1D5] shadow-xl shadow-stone-200/50 text-[#171717]'
        }`}
      >
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x ${
            isDark ? 'divide-[#08090B]' : 'divide-[#E8E1D5]'
          }`}
        >
          {STATS.map((stat, idx) => (
            <div key={idx} className={idx > 0 ? 'pt-4 md:pt-0 md:pl-6' : 'pt-4 md:pt-0'}>
              <div
                className={`text-3xl sm:text-4xl font-extrabold ${
                  isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
                }`}
              >
                {stat.value}
              </div>
              <div
                className={`text-xs sm:text-sm font-medium mt-1 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
