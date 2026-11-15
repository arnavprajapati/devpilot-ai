import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSection } from './sections/HeroSection';
import { RoadmapSimulationSection } from './sections/RoadmapSimulationSection';
import { StatsSection } from './sections/StatsSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { CtaSection } from './sections/CtaSection';
import { LoginView } from './sections/LoginView';
import { SignupView } from './sections/SignupView';
import { DashboardView } from './sections/DashboardView';

type ViewMode = 'landing' | 'login' | 'signup' | 'dashboard';

function getViewFromUrl(): ViewMode {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const hash = window.location.hash.replace(/^#+/, '').toLowerCase();
  const target = path || hash;
  if (target === 'login' || target === 'signup' || target === 'dashboard') {
    return target as ViewMode;
  }
  return 'landing';
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>(getViewFromUrl);

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentView(getViewFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (currentView === 'dashboard' && !isAuthenticated) {
      setCurrentView('login');
      window.history.replaceState(null, '', '/login');
    } else if ((currentView === 'login' || currentView === 'signup') && isAuthenticated) {
      setCurrentView('dashboard');
      window.history.replaceState(null, '', '/dashboard');
    }
  }, [currentView, isAuthenticated, isLoading]);

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
    const targetUrl = view === 'landing' ? '/' : `/${view}`;
    if (window.location.pathname !== targetUrl || window.location.hash) {
      window.history.pushState(null, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'login') {
    return <LoginView onNavigate={handleNavigate} />;
  }

  if (currentView === 'signup') {
    return <SignupView onNavigate={handleNavigate} />;
  }

  if (currentView === 'dashboard') {
    if (!isAuthenticated && !isLoading) {
      return <LoginView onNavigate={handleNavigate} />;
    }
    return <DashboardView onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-[#FF4055]/15 selection:text-[#FF4055]">
      <Navbar onNavigate={handleNavigate} />
      <main>
        <HeroSection onNavigate={handleNavigate} />
        <RoadmapSimulationSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection onNavigate={handleNavigate} />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
