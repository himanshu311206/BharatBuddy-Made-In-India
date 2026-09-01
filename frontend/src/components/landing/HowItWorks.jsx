import { useRef, useEffect } from 'react';
import { gsap } from './gsapSetup';

const STEPS = [
  {
    no: '01',
    title: 'Join',
    desc: 'Create your profile in under a minute — pick your interests, languages and what you are looking for.',
  },
  {
    no: '02',
    title: 'Discover',
    desc: 'BharatBuddy surfaces people and communities that fit your world — no endless scrolling required.',
  },
  {
    no: '03',
    title: 'Connect',
    desc: 'Start conversations with confidence, supported by verified profiles and safety tools built in.',
  },
  {
    no: '04',
    title: 'Experience',
    desc: 'Grow friendships, collaborations and experiences across a more connected Bharat.',
  },
];

export default function HowItWorks() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      // progress line grows with scroll across the whole timeline
      gsap.fromTo(
        '.bb-how__track',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.bb-how__grid',
            start: 'top 76%',
            end: 'bottom 55%',
            scrub: 0.5,
          },
        }
      );

      gsap.utils.toArray('.bb-how__step').forEach((step) => {
        gsap.timeline({
          scrollTrigger: { trigger: step, start: 'top 84%', once: true },
        })
          .fromTo(step.querySelector('.bb-how__no'), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' })
          .fromTo(step.querySelector('h3'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35')
          .fromTo(step.querySelector('p'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, '-=0.3');
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="bb-how" id="how-it-works" ref={rootRef}>
      <p className="bb-eyebrow bb-eyebrow--center">How it works</p>
      <h2 className="bb-display bb-how__heading">
        Four steps to a <span>real connection.</span>
      </h2>

      <div className="bb-how__grid">
        <div className="bb-how__track" aria-hidden="true" />
        {STEPS.map((s) => (
          <div className="bb-how__step" key={s.no}>
            <div className="bb-how__dot" aria-hidden="true">
              <span className="bb-how__no">{s.no}</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
