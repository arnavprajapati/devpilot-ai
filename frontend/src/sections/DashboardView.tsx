import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { LogOut, FolderGit2, Plus } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: 'landing' | 'login' | 'signup' | 'dashboard') => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('landing');
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="focus:outline-none cursor-pointer"
            >
              <Logo size="md" />
            </button>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-2 border-r border-zinc-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-zinc-900 leading-tight">
                  {user?.full_name || 'Developer'}
                </div>
                <div className="text-[11px] text-zinc-500 font-normal leading-tight">
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-50 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-[#FF4055] to-[#FF8A1C] bg-clip-text text-transparent">
                {user?.full_name || 'Developer'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1">
              Your DevPilot AI workspace is ready.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 mb-4">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 mb-1">No Projects Yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-6">
            You haven't created any projects or roadmaps yet. Click the button below to start when you're ready.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Project</span>
          </button>
        </div>
      </main>
    </div>
  );
}
