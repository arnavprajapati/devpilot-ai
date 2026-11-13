const STATS = [
  { value: '10x', label: 'Faster Roadmap Planning' },
  { value: '100%', label: 'AI-Structured Roadmaps' },
  { value: '4-Phase', label: 'Execution Framework' },
  { value: 'Zero', label: 'Manual Roadmap Overhead' },
];

export function StatsSection() {
  return (
    <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 mb-24">
      <div className="bg-black text-white rounded-2xl p-8 sm:p-10 border border-zinc-800 shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          {STATS.map((stat, idx) => (
            <div key={idx} className={idx > 0 ? 'pt-4 md:pt-0 md:pl-6' : 'pt-4 md:pt-0'}>
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
