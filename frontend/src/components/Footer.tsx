import { Logo } from './Logo';
import { GithubIcon } from './GithubIcon';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Interactive Preview', href: '#demo' },
];

const GITHUB_REPO_URL = 'https://github.com';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-14">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="w-fit mb-4">
              <Logo size="md" />
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-md font-normal">
              DevPilot AI is an AI-powered project planning and management platform that helps
              developers transform their ideas into structured development roadmaps, organize tasks,
              manage projects, and track progress from start to completion.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-600">
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  Home
                </a>
              </li>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-black transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-4">
              Dev Community
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-600">
              <li>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  Developer Roadmap
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  API & CLI Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black transition-colors">
                  Release Notes
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} DevPilot AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-900 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-900 cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-900 cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
