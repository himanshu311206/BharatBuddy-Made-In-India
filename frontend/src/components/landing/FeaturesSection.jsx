import { useRef, useEffect } from 'react';
import { gsap } from './gsapSetup';

const FEATURES = [
  {
    no: '01',
    title: 'Connect',
    desc: 'Find and connect with people who share your interests, languages and regional vibes.',
    visual: 'orbit',
    points: ['Interest & language matching', 'Verified network, zero spam', 'Real-time presence'],
  },
  {
    no: '02',
    title: 'Discover',
    desc: 'Discover useful places, communities and experiences around you and across the country.',
    visual: 'pins',
    points: ['Local communities & events', 'Experiences worth exploring', 'Curated for your world'],
  },
  {
    no: '03',
    title: 'AI Buddy',
    desc: 'Get intelligent assistance whenever you need it — guidance, answers and matches, 24/7.',
    visual: 'chat',
    points: ['Conversational AI assistance', 'Smart buddy suggestions', 'Voice-ready guidance'],
  },
  {
    no: '04',
    title: 'Explore Bharat',
    desc: "Experience India's diversity through one connected platform — from Kashmir to Kanyakumari.",
    visual: 'network',
    points: ['Pan-India presence', 'Regional languages honoured', 'Culture-aware matching'],
  },
];

/** Server-side-style tiny visuals — pure CSS/SVG, no extra 3D canvases. */
function FeatureVisual({ kind }) {
  if (kind === 'orbit') {
    return (
      <div className="bb-fv bb-fv--orbit" aria-hidden="true">
        <span className="bb-fv__ring bb-fv__ring--1" />
        <span className="bb-fv__ring bb-fv__ring--2" />
        {[0, 1, 2, 3].map((i) => (
          <span className={`bb-fv__dot bb-fv__dot--${i}`} key={i} />
        ))}
        <span className="bb-fv__core">BB</span>
      </div>
    );
  }
  if (kind === 'pins') {
    return (
      <div className="bb-fv bb-fv--pins" aria-hidden="true">
        <svg viewBox="0 0 220 200">
          <g className="bb-fv__grid">
            {[...Array(5)].map((_, r) => (
              <line key={r} x1="10" y1={30 + r * 38} x2="210" y2={30 + r * 38} />
            ))}
            {[...Array(6)].map((_, c) => (
              <line key={c} x1={20 + c * 38} y1="10" x2={20 + c * 38} y2="190" />
            ))}
          </g>
          <circle className="bb-fv__poi" cx="110" cy="100" r="8" />
          <circle className="bb-fv__haze" cx="60" cy="70" r="5" />
          <circle className="bb-fv__haze" cx="160" cy="140" r="5" />
          <circle className="bb-fv__haze" cx="150" cy="55" r="5" />
          <circle className="bb-fv__haze" cx="66" cy="146" r="5" />
        </svg>
      </div>
    );
  }
  if (kind === 'chat') {
    return (
      <div className="bb-fv bb-fv--chat" aria-hidden="true">
        <div className="bb-fv__bubble bb-fv__bubble--ai">
          <i /><i /><i />
        </div>
        <div className="bb-fv__bubble bb-fv__bubble--user">Nice!</div>
        <div className="bb-fv__bubble bb-fv__bubble--user">Where should I go today? 🤔</div>
        <div className="bb-fv__bubble bb-fv__bubble--ai">Try the rooftop cafés near you…</div>
      </div>
    );
  }
  return (
    <div className="bb-fv bb-fv--network" aria-hidden="true">
      <span className="bb-fv__node bb-fv__node--1" />
      <span className="bb-fv__node bb-fv__node--2" />
      <span className="bb-fv__node bb-fv__node--3" />
      <span className="bb-fv__node bb-fv__node--4" />
      <span className="bb-fv__node bb-fv__node--5" />
      <svg viewBox="0 0 220 200">
        <line x1="40" y1="100" x2="110" y2="40" />
        <line x1="110" y1="40" x2="180" y2="150" />
        <line x1="180" y1="150" x2="40" y2="100" />
        <line x1="40" y1="100" x2="110" y2="160" />
        <line x1="110" y1="160" x2="180" y2="150" />
        <line x1="110" y1="40" x2="60" y2="170" />
      </svg>
      <span className="bb-fv__node bb-fv__node--6" />
      <span className="bb-fv__node bb-fv__node--7" />
    </div>
  );
}

export default function FeaturesSection() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.bb-feature').forEach((row) => {
        const dir = row.dataset.dir;
        gsap.fromTo(
          row.querySelector('.bb-feature__text'),
          { opacity: 0, x: dir === 'right' ? -60 : 60, y: 30 },
          {
            opacity: 1, x: 0, y: 0, duration: 0.95, ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 78%', once: true },
          }
        );
        gsap.fromTo(
          row.querySelector('.bb-feature__visual'),
          { opacity: 0, scale: 0.9, y: 40 },
          {
            opacity: 1, scale: 1, y: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 78%', once: true },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="bb-features" id="features" ref={rootRef}>
      <p className="bb-eyebrow bb-eyebrow--center">Capabilities</p>
      <h2 className="bb-display bb-features__heading" data-word>
        Everything you need.
        <span>Nothing you don't.</span>
      </h2>

      <div className="bb-features__list">
        {FEATURES.map((f, i) => {
          const dir = i % 2 === 0 ? 'left' : 'right';
          return (
            <article
              className="bb-feature"
              data-dir={dir}
              key={f.no}
              data-cursor="grow"
            >
              <div className="bb-feature__visual-wrap">
                <div className={`bb-feature__panel bb-feature__panel--${f.no}`}>
                  <FeatureVisual kind={f.visual} />
                  <span className="bb-feature__no" aria-hidden="true">{f.no}</span>
                </div>
              </div>

              <div className="bb-feature__text">
                <h3 className="bb-feature__title">{f.title}</h3>
                <p className="bb-feature__desc">{f.desc}</p>
                <ul className="bb-feature__points">
                  {f.points.map((p) => (
                    <li key={p}>
                      <i className="fa-solid fa-check" aria-hidden="true" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
