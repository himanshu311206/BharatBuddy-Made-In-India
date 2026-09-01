import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from './gsapSetup';
import Magnetic from './Magnetic';

export default function CtaSection() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: { trigger: rootRef.current, start: 'top 72%', once: true },
      })
        .fromTo('.bb-cta [data-head]', { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.14, ease: 'power3.out' })
        .fromTo('.bb-cta__particles i', { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.04, ease: 'power2.out' }, '-=0.4');
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const PARTICLES = [
    { t: '8%', l: '14%', d: '0s' }, { t: '22%', l: '78%', d: '1.2s' }, { t: '38%', l: '8%', d: '0.7s' },
    { t: '52%', l: '86%', d: '2s' }, { t: '66%', l: '16%', d: '1.5s' }, { t: '78%', l: '72%', d: '0.4s' },
    { t: '88%', l: '34%', d: '2.6s' }, { t: '12%', l: '44%', d: '1.9s' }, { t: '70%', l: '46%', d: '0.9s' },
  ];

  return (
    <section className="bb-cta" id="cta" ref={rootRef}>
      <div className="bb-cta__bg" aria-hidden="true">
        <div className="bb-cta__glow bb-cta__glow--1" />
        <div className="bb-cta__glow bb-cta__glow--2" />
        <div className="bb-cta__particles">
          {PARTICLES.map((p, i) => (
            <i key={i} style={{ top: p.t, left: p.l, animationDelay: p.d }} />
          ))}
        </div>
      </div>

      <h2 className="bb-display bb-cta__title" data-head>
        Ready to find <span>your Buddy?</span>
      </h2>
      <p className="bb-cta__sub" data-head>Step into a more connected Bharat.</p>

      <div className="bb-cta__actions" data-head>
        <Magnetic strength={0.32}>
          <Link to="/register" className="bb-btn bb-btn--primary bb-btn--xl">
            Get Started <span className="bb-btn__arrow" aria-hidden="true">→</span>
          </Link>
        </Magnetic>
      </div>
    </section>
  );
}
