import { lazy, Suspense, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from './gsapSetup';
import Magnetic from './Magnetic';

const HeroScene = lazy(() => import('./HeroScene'));

const FLOATING = [
  { cls: 'bb-float--tl', dot: 'dot-1', title: 'Live conversations' },
  { cls: 'bb-float--tr', dot: 'dot-2', title: '28 states · one Bharat' },
  { cls: 'bb-float--bl', dot: 'dot-3', title: 'AI Buddy online' },
  { cls: 'bb-float--br', dot: 'dot-4', title: 'Protected · verified' },
];

const FLOATING_PARTICLES = [
  { l: '8%', d: '9s', dl: '0s' }, { l: '22%', d: '11s', dl: '1.4s' },
  { l: '35%', d: '8s', dl: '0.8s' }, { l: '47%', d: '12s', dl: '2.2s' },
  { l: '58%', d: '10s', dl: '0.5s' }, { l: '70%', d: '9.5s', dl: '1.8s' },
  { l: '82%', d: '11.5s', dl: '0.3s' }, { l: '92%', d: '8.5s', dl: '2.6s' },
];

export default function Hero() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const counters = gsap.utils.toArray('.bb-hero__stat .bb-count');
    if (reduced) {
      counters.forEach((el) => { el.textContent = el.dataset.count; });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.bb-hero__eyebrow', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8 }, 0.1);
      tl.fromTo(
        '.bb-hero__title .bb-line',
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.05, stagger: 0.12 },
        0.2
      );
      tl.fromTo('.bb-hero__sub', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8 }, 0.7);
      tl.fromTo('.bb-hero__ctas', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, 0.85);
      tl.fromTo('.bb-hero__stats', { opacity: 0 }, { opacity: 1, duration: 0.9 }, 1.05);
      tl.fromTo('.bb-scene', { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'power2.out' }, 0.4);
      tl.fromTo('.bb-float', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.12 }, 1.2);
      tl.fromTo('.bb-scroll-indicator', { opacity: 0 }, { opacity: 1, duration: 0.7 }, 1.55);
      // count-up for the stats row, timed to the reveal
      tl.add(() => {
        counters.forEach((elData) => {
          const end = parseInt(elData.dataset.count, 10);
          const o = { v: 0 };
          gsap.to(o, {
            v: end,
            duration: 1.8,
            ease: 'power3.out',
            onUpdate: () => { elData.textContent = Math.round(o.v); },
          });
        });
      }, 1.2);
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // mouse-follow spotlight across the hero background (fine pointers only)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    let tx = 50, ty = 40, cx = 50, cy = 40, raf = null;
    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      root.classList.add('bb-hero--spot-on');
    };
    const tick = () => {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      root.style.setProperty('--bb-spot-x', `${cx.toFixed(2)}%`);
      root.style.setProperty('--bb-spot-y', `${cy.toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    };
    root.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      root.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove('bb-hero--spot-on');
    };
  }, []);

  return (
    <section className="bb-hero" id="home" ref={rootRef}>
      {/* layered cinematic background */}
      <div className="bb-hero__bg" aria-hidden="true">
        <div className="bb-hero__bg-aurora bb-hero__bg-aurora--1" />
        <div className="bb-hero__bg-aurora bb-hero__bg-aurora--2" />
        <div className="bb-hero__bg-grid" />
        <div className="bb-hero__bg-noise" />
        <div className="bb-hero__bg-vignette" />
        <div className="bb-hero__bg-spotlight" />
      </div>

      <div className="bb-hero__content">
        <div className="bb-hero__eyebrow">
          <span className="bb-eyebrow-dot" aria-hidden="true" />
          BharatBuddy · Your Digital Buddy for a Better India
        </div>

        <h1 className="bb-hero__title">
          <span className="bb-line">Meet Your Buddy</span>
          <span className="bb-line">
            in <em className="bb-hero__bharat">Bharat<svg viewBox="0 0 220 14" preserveAspectRatio="none" aria-hidden="true"><path d="M4 11 C60 2, 160 2, 216 9" /></svg></em>
          </span>
        </h1>

        <p className="bb-hero__sub">
          One place to connect with people, discover experiences, explore opportunities,
          and experience a smarter, more connected Bharat.
        </p>

        <div className="bb-hero__ctas">
          <Magnetic strength={0.28}>
            <Link to="/register" className="bb-btn bb-btn--primary bb-btn--lg">
              Explore BharatBuddy
              <span className="bb-btn__arrow" aria-hidden="true">→</span>
            </Link>
          </Magnetic>
          <Magnetic strength={0.2}>
            <a href="#how-it-works" className="bb-btn bb-btn--ghost bb-btn--lg">
              <span className="bb-btn__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
              </span>
              See How It Works
            </a>
          </Magnetic>
        </div>

        <div className="bb-hero__stats">
          <div className="bb-hero__stat"><strong><span className="bb-count" data-count="28">0</span></strong><span>States</span></div>
          <div className="bb-hero__stat"><strong><span className="bb-count" data-count="8">0</span></strong><span>UTs</span></div>
          <div className="bb-hero__stat"><strong><span className="bb-count" data-count="22">0</span>+</strong><span>Languages</span></div>
          <div className="bb-hero__stat"><strong><span className="bb-count" data-count="24">0</span>/7</strong><span>AI Assistance</span></div>
        </div>
      </div>

      {/* cinematic 3D centerpiece */}
      <div className="bb-scene">
        <div className="bb-scene__frame">
          <div className="bb-scene__screen">
            <Suspense fallback={<div className="bb-hero__scene-fallback" aria-hidden="true" />}>
              <HeroScene />
            </Suspense>
          </div>
          <div className="bb-scene__glow" aria-hidden="true" />
          <div className="bb-scene__flare" aria-hidden="true" />
          <div className="bb-scene__shine" aria-hidden="true" />
        </div>

        <div className="bb-orbit" aria-hidden="true">
          <div className="bb-orbit__ring bb-orbit__ring--a">
            <span className="bb-orbit__sat" />
          </div>
          <div className="bb-orbit__ring bb-orbit__ring--b">
            <span className="bb-orbit__sat" />
          </div>
        </div>

        <div className="bb-particles" aria-hidden="true">
          {FLOATING_PARTICLES.map((p, i) => (
            <span className="bb-particle" key={i} style={{ left: p.l, animationDuration: p.d, animationDelay: p.dl }} />
          ))}
        </div>

        {FLOATING.map((f) => (
          <div className={`bb-float ${f.cls}`} key={f.cls} aria-hidden="true">
            <span className={`bb-float__dot ${f.dot}`} />
            <span>{f.title}</span>
          </div>
        ))}
      </div>

      <div className="bb-scroll-indicator" aria-hidden="true">
        <span>Scroll</span>
        <span className="bb-scroll-indicator__track" />
      </div>
    </section>
  );
}
