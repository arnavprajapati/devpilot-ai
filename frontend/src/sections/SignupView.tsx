import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ArrowRight, Lock, Mail, User as UserIcon, AlertCircle, ArrowLeft } from 'lucide-react';

interface SignupViewProps {
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function SignupView({ onNavigate }: SignupViewProps) {
  const { register } = useAuth();
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
    <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-center items-center px-4 relative bg-zinc-50 select-none">
      <div className="absolute top-5 left-5 sm:top-8 sm:left-10 z-20">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-black py-2 px-3 rounded-xl hover:bg-zinc-200/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="w-full max-w-md text-center mb-3">
        <div className="flex justify-center mb-2">
          <div onClick={() => onNavigate('landing')} className="cursor-pointer">
            <Logo size="md" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
          Create Your Account
        </h2>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Start turning your software ideas into production roadmaps.
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white py-5 px-6 sm:px-8 border border-zinc-200 shadow-xl shadow-zinc-200/40 rounded-2xl">
          {error && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                Full Name
              </label>
              <div className="relative rounded-xl border border-zinc-200 focus-within:border-black transition-colors">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl border border-zinc-200 focus-within:border-black transition-colors">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                Password
              </label>
              <div className="relative rounded-xl border border-zinc-200 focus-within:border-black transition-colors">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                Confirm Password
              </label>
              <div className="relative rounded-xl border border-zinc-200 focus-within:border-black transition-colors">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl focus:outline-none text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-black hover:bg-zinc-800 focus:outline-none transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating Account...' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-3.5 pt-3.5 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-600 font-normal">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-bold text-black hover:text-[#FF4055] transition-colors cursor-pointer"
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
