import { useState, useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import Hero from '../components/landing/Hero';
import ProblemSection from '../components/landing/ProblemSection';
import WhatIsSection from '../components/landing/WhatIsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import AiBuddySection from '../components/landing/AiBuddySection';
import BharatNetwork from '../components/landing/BharatNetwork';
import HowItWorks from '../components/landing/HowItWorks';
import TrustSection from '../components/landing/TrustSection';
import CtaSection from '../components/landing/CtaSection';
import LandingFooter from '../components/landing/LandingFooter';
import CustomCursor from '../components/landing/CustomCursor';
import ScrollProgress from '../components/landing/ScrollProgress';
import Preloader from '../components/landing/Preloader';
import { gsap, ScrollTrigger } from '../components/landing/gsapSetup';

import '../styles/landing/01-base.css';
import '../styles/landing/02-hero.css';
import '../styles/landing/03-sections.css';
import '../styles/landing/04-animations.css';
import '../styles/landing/05-responsive.css';

export default function LandingPage() {
  const [ready, setReady] = useState(false);

  // Darken the document behind the landing experience without touching
  // the rest of the app (removed on unmount).
  useEffect(() => {
    document.body.classList.add('bb-landing-doc');
    return () => document.body.classList.remove('bb-landing-doc');
  }, []);

  // Keep ScrollTrigger measurements in sync with viewport changes.
  useEffect(() => {
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (ready) {
      gsap.delayedCall(0.15, () => ScrollTrigger.refresh());
    }
  }, [ready]);

  return (
    <div className="bb-landing">
      <ScrollProgress />
      <CustomCursor />

      {!ready && <Preloader onDone={() => setReady(true)} />}

      <LandingNavbar />

      <main className="bb-landing__main">
        <Hero />
        <ProblemSection />
        <WhatIsSection />
        <FeaturesSection />
        <AiBuddySection />
        <BharatNetwork />
        <HowItWorks />
        <TrustSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
