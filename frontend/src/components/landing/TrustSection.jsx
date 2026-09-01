import { useRef, useEffect } from 'react';
import { gsap } from './gsapSetup';

const HIGHLIGHTS = [
  { icon: 'fa-solid fa-user-check', title: 'Verified profiles', desc: 'Identity checks keep the community real and spam-free.' },
  { icon: 'fa-solid fa-shield-halved', title: 'Safety first', desc: 'Block, report and control who reaches you — built in from day one.' },
  { icon: 'fa-solid fa-mobile-screen', title: 'Anywhere, anytime', desc: 'A seamless experience across devices and across India.' },
  { icon: 'fa-solid fa-earth-asia', title: 'Languages honoured', desc: 'Speak your language — profiles, matchmaking and chat understand it.' },
];

export default function TrustSection() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bb-trust [data-head]',
        { opacity: 0, y: 42 },
        {
          opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 76%', once: true },
        }
      );
      gsap.utils.toArray('.bb-trust__card').forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 36, scale: 0.96 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.8, delay: 0.15 + i * 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: '.bb-trust__grid', start: 'top 82%', once: true },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="bb-trust" id="trust" ref={rootRef}>
      <div className="bb-trust__glow" aria-hidden="true" />
      <p className="bb-eyebrow bb-eyebrow--center" data-head>Why BharatBuddy</p>
      <h2 className="bb-display bb-trust__heading" data-head>
        Built on <span>trust & safety.</span>
      </h2>
      <p className="bb-trust__lede" data-head>
        Great connections only happen in a space people feel safe in. We designed BharatBuddy to be that space.
      </p>

      <div className="bb-trust__grid">
        {HIGHLIGHTS.map((h) => (
          <article className="bb-trust__card" key={h.title} data-cursor="grow">
            <span className="bb-trust__icon" aria-hidden="true">
              <i className={h.icon} />
            </span>
            <h3>{h.title}</h3>
            <p>{h.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
