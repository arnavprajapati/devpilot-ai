import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/Logo';
import { ArrowRight, Lock, Mail, User as UserIcon, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react';

interface SignupViewProps {
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function SignupView({ onNavigate }: SignupViewProps) {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(fullName.trim(), email.trim(), password, confirmPassword);
    setIsSubmitting(false);

    if (result.success) {
      onNavigate('dashboard');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden flex flex-col justify-center items-center px-4 relative transition-colors duration-300 ${
        isDark ? 'bg-[#08090B] text-[#F5F3EF]' : 'bg-[#F7F3EA] text-[#171717]'
      }`}
    >
      <div className="absolute top-5 left-5 sm:top-8 sm:left-10 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className={`inline-flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl transition-colors cursor-pointer border ${
            isDark
              ? 'text-[#A6A4A0] hover:text-[#F5F3EF] bg-[#18191D] border-[#242321] hover:bg-[#242321]'
              : 'text-[#6B665E] hover:text-[#171717] bg-white border-[#E8E1D5] hover:bg-stone-100 shadow-2xs'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-all cursor-pointer border ${
            isDark
              ? 'text-[#FFC900] bg-[#18191D] hover:bg-[#242321] border-[#343330]'
              : 'text-[#D9A300] bg-white hover:bg-[#F5EFE6] border-[#E8E1D5] shadow-2xs'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-md text-center mb-3">
        <div className="flex justify-center mb-2">
          <div onClick={() => onNavigate('landing')} className="cursor-pointer">
            <Logo size="md" theme={theme} />
          </div>
        </div>
        <h2
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-[#F5F3EF]' : 'text-[#171717]'
          }`}
        >
          Create Your Account
        </h2>
        <p
          className={`text-xs mt-0.5 ${
            isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
          }`}
        >
          Start turning your software ideas into production roadmaps.
        </p>
      </div>

      <div className="w-full max-w-md">
        <div
          className={`py-5 px-6 sm:px-8 border rounded-2xl transition-colors ${
            isDark
              ? 'bg-[#18191D] border-[#242321] shadow-2xl shadow-black/80'
              : 'bg-white border-[#E8E1D5] shadow-xl shadow-stone-200/50'
          }`}
        >
          {error && (
            <div
              className={`mb-3.5 p-2.5 rounded-xl border flex items-start gap-2.5 text-xs font-medium ${
                isDark
                  ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Full Name
              </label>
              <div
                className={`relative rounded-xl border transition-colors ${
                  isDark
                    ? 'border-[#242321] bg-[#08090B] focus-within:border-[#FFC900]'
                    : 'border-[#E8E1D5] bg-white focus-within:border-[#D9A300]'
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none bg-transparent ${
                    isDark
                      ? 'text-[#F5F3EF] placeholder:text-[#A6A4A0]/50'
                      : 'text-[#171717] placeholder:text-[#6B665E]/50'
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Email Address
              </label>
              <div
                className={`relative rounded-xl border transition-colors ${
                  isDark
                    ? 'border-[#242321] bg-[#08090B] focus-within:border-[#FFC900]'
                    : 'border-[#E8E1D5] bg-white focus-within:border-[#D9A300]'
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none bg-transparent ${
                    isDark
                      ? 'text-[#F5F3EF] placeholder:text-[#A6A4A0]/50'
                      : 'text-[#171717] placeholder:text-[#6B665E]/50'
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Password
              </label>
              <div
                className={`relative rounded-xl border transition-colors ${
                  isDark
                    ? 'border-[#242321] bg-[#08090B] focus-within:border-[#FFC900]'
                    : 'border-[#E8E1D5] bg-white focus-within:border-[#D9A300]'
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none bg-transparent ${
                    isDark
                      ? 'text-[#F5F3EF] placeholder:text-[#A6A4A0]/50'
                      : 'text-[#171717] placeholder:text-[#6B665E]/50'
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
                }`}
              >
                Confirm Password
              </label>
              <div
                className={`relative rounded-xl border transition-colors ${
                  isDark
                    ? 'border-[#242321] bg-[#08090B] focus-within:border-[#FFC900]'
                    : 'border-[#E8E1D5] bg-white focus-within:border-[#D9A300]'
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none bg-transparent ${
                    isDark
                      ? 'text-[#F5F3EF] placeholder:text-[#A6A4A0]/50'
                      : 'text-[#171717] placeholder:text-[#6B665E]/50'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:brightness-105 cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#FFC900] text-[#08090B]'
                  : 'bg-[#D9A300] text-white'
              }`}
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div
            className={`mt-3.5 pt-3.5 border-t text-center ${
              isDark ? 'border-[#242321]' : 'border-stone-100'
            }`}
          >
            <p
              className={`text-xs ${
                isDark ? 'text-[#A6A4A0]' : 'text-[#6B665E]'
              }`}
            >
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className={`font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#FFC900] hover:underline'
                    : 'text-[#D9A300] hover:underline'
                }`}
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
