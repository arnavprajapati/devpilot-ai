interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showUnderline?: boolean;
  theme?: 'light' | 'dark';
}

export function Logo({ size = 'md', showUnderline = true, theme = 'dark' }: LogoProps) {
  if (theme === 'dark' || theme === 'light') {
    const sizeClasses = {
      sm: 'text-lg sm:text-xl',
      md: 'text-xl sm:text-2xl',
      lg: 'text-2xl sm:text-3xl',
    };
    const isDark = theme === 'dark';
    return (
      <div className="flex items-center gap-1.5 select-none cursor-pointer">
        <span
          className={`${sizeClasses[size]} font-bold tracking-tight transition-colors ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          DevPilot
        </span>
        <span
          className={`${sizeClasses[size]} font-bold tracking-tight transition-colors ${
            isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'
          }`}
        >
          AI
        </span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
  };

  const barClasses = {
    sm: 'w-16 h-[2.5px]',
    md: 'w-20 h-[3.5px]',
    lg: 'w-24 h-[4px]',
  };

  return (
    <div className="flex flex-col group select-none cursor-pointer">
      <span
        className={`${sizeClasses[size]} font-black italic tracking-tight bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent`}
      >
        DevPilot AI
      </span>
      {showUnderline && (
        <span
          className={`${barClasses[size]} rounded-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] mt-0.5 group-hover:w-full transition-all duration-300`}
        />
      )}
    </div>
  );
}
