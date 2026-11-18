import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, Sun, Moon } from 'lucide-react';
import { Logo } from './Logo';
import { GithubIcon } from './GithubIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Roadmap', href: '#how-it-works' },
  { label: 'About', href: '#demo' },
];

const GITHUB_REPO_URL = 'https://github.com/arnavprajapati';

interface NavbarProps {
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
  currentView?: 'landing' | 'login' | 'signup' | 'dashboard';
}

export function Navbar({ onNavigate, currentView = 'landing' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleNavLinkClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (currentView === 'dashboard') {
      e.preventDefault();
      onNavigate('landing');
      setTimeout(() => {
        const id = href.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <header
      className={`w-full z-50 transition-colors duration-300 font-['Plus_Jakarta_Sans',sans-serif] bg-transparent ${
        currentView === 'dashboard' ? 'relative' : 'absolute top-0 inset-x-0'
      } ${isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'}`}
    >
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 h-20 sm:h-24 flex items-center justify-between relative">
        <div onClick={() => onNavigate('landing')} className="focus:outline-none cursor-pointer z-10">
          <Logo size="md" theme={theme} />
        </div>

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 z-10">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavLinkClick(e, link.href)}
              className={`text-base font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                  : 'text-[#6B665E] hover:text-[#171717]'
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className={`text-base font-medium transition-colors flex items-center gap-1.5 ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                : 'text-[#6B665E] hover:text-[#171717]'
            }`}
          >
            <GithubIcon className="w-4 h-4" />
            GitHub
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3.5 z-10">
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isDark
                ? 'text-[#FFC900] bg-[#18191C] hover:bg-[#242321] border border-[#343330]'
                : 'text-[#D9A300] bg-[#FFFFFF] hover:bg-[#F5EFE6] border border-[#E8E1D5] shadow-xs'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold transition-all cursor-pointer shadow-xs ${
                  currentView === 'dashboard'
                    ? isDark
                      ? 'bg-[#FFC900] text-[#08090B] border border-[#FFC900]'
                      : 'bg-[#D9A300] text-white border border-[#D9A300]'
                    : isDark
                    ? 'bg-[#18191C] text-[#F5F3EF] border border-[#343330] hover:border-[#FFC900]/60 hover:bg-[#242321]'
                    : 'bg-[#FFFFFF] text-[#171717] border border-[#E8E1D5] hover:border-[#D9A300]/60 hover:bg-[#F5EFE6]'
                }`}
              >
                <LayoutDashboard className={`w-3.5 h-3.5 ${currentView === 'dashboard' ? (isDark ? 'text-[#08090B]' : 'text-white') : (isDark ? 'text-[#FFC900]' : 'text-[#D9A300]')}`} />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className={`group inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold transition-all cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-[#18191C] text-[#F5F3EF] border border-[#343330] hover:border-red-400/60 hover:text-red-300 hover:bg-[#242321]'
                    : 'bg-[#FFFFFF] text-[#171717] border border-[#E8E1D5] hover:border-red-400/60 hover:text-red-600 hover:bg-[#FFFDF8]'
                }`}
              >
                <LogOut className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className={`text-base font-medium px-3 py-2 transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#A6A4A0] hover:text-[#F5F3EF]'
                    : 'text-[#6B665E] hover:text-[#171717]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-base font-medium transition-all cursor-pointer ${
                  isDark
                    ? 'border border-[#FFC900]/60 bg-transparent text-[#F5F3EF] hover:border-[#FFC900] hover:text-[#FFC900] hover:bg-[#FFC900]/10'
                    : 'border border-[#D9A300]/70 bg-[#FFFFFF] text-[#171717] hover:border-[#D9A300] hover:text-[#D9A300] hover:bg-[#D9A300]/10 shadow-xs'
                }`}
              >
                <span>Get Started</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#FFC900]' : 'text-[#D9A300]'}`} />
              </button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all ${
              isDark
                ? 'text-[#FFC900] border border-[#242321]'
                : 'text-[#D9A300] border border-[#E8E1D5]'
            }`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg focus:outline-none ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-[#FFFFFF]'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className={`md:hidden px-4 pt-3 pb-6 space-y-3 shadow-lg ${
            isDark
              ? 'border-b border-[#242321] bg-[#08090B]'
              : 'border-b border-[#E8E1D5] bg-[#F7F3EA]'
          }`}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleNavLinkClick(e, link.href);
              }}
              className={`block px-3 py-2 text-base font-medium rounded-lg ${
                isDark
                  ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                  : 'text-[#6B665E] hover:text-[#171717] hover:bg-[#FFFFFF]'
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2 px-3 py-2 text-base font-medium rounded-lg ${
              isDark
                ? 'text-[#A6A4A0] hover:text-[#F5F3EF] hover:bg-[#242321]'
                : 'text-[#6B665E] hover:text-[#171717] hover:bg-[#FFFFFF]'
            }`}
          >
            <GithubIcon className="w-4 h-4" />
            <span>GitHub Repository</span>
          </a>
          <div
            className={`pt-4 border-t flex flex-col gap-2.5 ${
              isDark ? 'border-[#242321]' : 'border-[#E8E1D5]'
            }`}
          >
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('dashboard');
                  }}
                  className={`w-full text-center px-4 py-2.5 text-base font-semibold rounded-xl cursor-pointer ${
                    currentView === 'dashboard'
                      ? isDark
                        ? 'bg-[#FFC900] text-[#08090B]'
                        : 'bg-[#D9A300] text-white'
                      : isDark
                      ? 'text-[#F5F3EF] bg-[#242321] hover:bg-[#242321]/80'
                      : 'text-[#171717] bg-[#FFFFFF] border border-[#E8E1D5]'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className={`w-full text-center px-4 py-2.5 text-base font-semibold rounded-xl cursor-pointer transition-colors ${
                    isDark
                      ? 'text-[#F5F3EF] bg-[#18191C] border border-[#343330] hover:border-red-400/60 hover:text-red-300'
                      : 'text-[#171717] bg-[#FFFFFF] border border-[#E8E1D5] hover:border-red-400/60 hover:text-red-600'
                  }`}
                >
                  Logout
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
                  className={`w-full text-center px-4 py-2.5 text-base font-medium rounded-xl cursor-pointer ${
                    isDark
                      ? 'text-[#A6A4A0] hover:text-[#F5F3EF] border border-[#242321]'
                      : 'text-[#6B665E] hover:text-[#171717] border border-[#E8E1D5]'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('signup');
                  }}
                  className={`w-full text-center px-4 py-2.5 text-base font-semibold rounded-xl cursor-pointer ${
                    isDark
                      ? 'text-[#08090B] bg-[#FFC900] hover:bg-[#FFC900]/90'
                      : 'text-[#FFFFFF] bg-[#D9A300] hover:bg-[#D9A300]/90'
                  }`}
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
