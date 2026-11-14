import { useState } from 'react';
import { Menu, X, ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { GithubIcon } from './GithubIcon';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Interactive Preview', href: '#demo' },
];

const GITHUB_REPO_URL = 'https://github.com';

interface NavbarProps {
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 transition-all">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        <div onClick={() => onNavigate('landing')} className="focus:outline-none cursor-pointer">
          <Logo size="md" />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-zinc-600 hover:text-black transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-zinc-600 hover:text-black transition-colors flex items-center gap-1.5"
          >
            <GithubIcon className="w-4 h-4" />
            GitHub
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard ({user?.full_name?.split(' ')[0] || 'User'})</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-sm font-semibold text-zinc-700 hover:text-black px-3 py-2 transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm hover:shadow cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-600 hover:text-black hover:bg-zinc-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold text-zinc-700 hover:bg-zinc-50 rounded-lg"
            >
              {link.label}
            </a>
          ))}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-base font-semibold text-zinc-700 hover:bg-zinc-50 rounded-lg"
          >
            <GithubIcon className="w-5 h-5" />
            <span>GitHub Repository</span>
          </a>
          <div className="pt-4 border-t border-zinc-100 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('dashboard');
                  }}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-black rounded-xl hover:bg-zinc-800 cursor-pointer"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 cursor-pointer"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('login');
                  }}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-zinc-800 border border-zinc-200 rounded-xl cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('signup');
                  }}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-black rounded-xl hover:bg-zinc-800 cursor-pointer"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
