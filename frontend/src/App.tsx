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

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'login' || hash === 'signup' || hash === 'dashboard') {
      return hash as ViewMode;
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'login' || hash === 'signup' || hash === 'dashboard') {
        setCurrentView(hash as ViewMode);
      } else if (!hash) {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (currentView === 'dashboard' && !isAuthenticated) {
      setCurrentView('login');
      window.location.hash = 'login';
    } else if ((currentView === 'login' || currentView === 'signup') && isAuthenticated) {
      setCurrentView('dashboard');
      window.location.hash = 'dashboard';
    }
  }, [currentView, isAuthenticated, isLoading]);

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
    if (view === 'landing') {
      window.history.pushState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = view;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
