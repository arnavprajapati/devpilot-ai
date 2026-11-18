import { Logo } from './Logo';
import { GithubIcon } from './GithubIcon';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Interactive Preview', href: '#demo' },
];

const GITHUB_REPO_URL = 'https://github.com/arnavprajapati';

export function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer
      className={`border-t py-14 transition-colors duration-300 ${
        isDark
          ? 'border-[#242321] bg-[#08090B]'
          : 'border-[#E8E1D5] bg-[#F7F3EA]'
      }`}
    >
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="w-fit mb-4">
              <Logo size="md" theme={theme} />
            </div>
            <p
              className={`text-xs sm:text-sm leading-relaxed max-w-md font-normal ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              DevPilot AI is an AI-powered project planning and management platform that helps
              developers transform their ideas into structured development roadmaps, organize tasks,
              manage projects, and track progress from start to completion.
            </p>
          </div>

          <div>
            <h4
              className={`text-xs font-bold uppercase tracking-wider mb-4 ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              Navigation
            </h4>
            <ul
              className={`space-y-2.5 text-xs sm:text-sm ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              <li>
                <a
                  href="#"
                  className={`transition-colors ${
                    isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
                  }`}
                >
                  Home
                </a>
              </li>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`transition-colors ${
                      isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className={`text-xs font-bold uppercase tracking-wider mb-4 ${
                isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
              }`}
            >
              Dev Community
            </h4>
            <ul
              className={`space-y-2.5 text-xs sm:text-sm ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              <li>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={`transition-colors flex items-center gap-1.5 ${
                    isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
                  }`}
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition-colors ${
                    isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
                  }`}
                >
                  Developer Roadmap
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition-colors ${
                    isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
                  }`}
                >
                  API & CLI Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition-colors ${
                    isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
                  }`}
                >
                  Release Notes
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
            isDark
              ? 'border-[#242321] text-[#A6A4A0]'
              : 'border-[#E8E1D5] text-[#6B665E]'
          }`}
        >
          <p>© {new Date().getFullYear()} DevPilot AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span
              className={`cursor-pointer transition-colors ${
                isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
              }`}
            >
              Privacy Policy
            </span>
            <span
              className={`cursor-pointer transition-colors ${
                isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
              }`}
            >
              Terms of Service
            </span>
            <span
              className={`cursor-pointer transition-colors ${
                isDark ? 'hover:text-[#FFC900]' : 'hover:text-[#D9A300]'
              }`}
            >
              Security
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
