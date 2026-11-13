import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSection } from './sections/HeroSection';
import { RoadmapSimulationSection } from './sections/RoadmapSimulationSection';
import { StatsSection } from './sections/StatsSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { CtaSection } from './sections/CtaSection';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-[#FF4055]/15 selection:text-[#FF4055]">
      <Navbar />
      <main>
        <HeroSection />
        <RoadmapSimulationSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
