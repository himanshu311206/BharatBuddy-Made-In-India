import { useRef, useEffect } from 'react';
import { gsap } from './gsapSetup';
import Reveal from './Reveal';

const CARDS = [
  { icon: 'fa-solid fa-handshake', label: 'Connect', note: 'find your people' },
  { icon: 'fa-solid fa-compass', label: 'Discover', note: 'places & communities' },
  { icon: 'fa-solid fa-earth-asia', label: 'Explore', note: 'all of Bharat' },
  { icon: 'fa-solid fa-comment-dots', label: 'Communicate', note: 'in real time' },
  { icon: 'fa-solid fa-briefcase', label: 'Opportunities', note: 'study · work · grow' },
  { icon: 'fa-solid fa-wand-magic-sparkles', label: 'AI Assistance', note: 'always around' },
];

export default function WhatIsSection() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bb-whatis__heading [data-word]',
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.95,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '.bb-whatis__heading', start: 'top 82%', once: true },
        }
      );

      gsap.utils.toArray('.bb-whatis__card').forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="bb-whatis" id="about" ref={rootRef}>
      <div className="bb-whatis__inner">
        <p className="bb-eyebrow bb-eyebrow--center">What is BharatBuddy?</p>

        <h2 className="bb-whatis__heading bb-display">
          <span data-word>One Buddy.</span>
          <br />
          <span data-word>Many Possibilities.</span>
        </h2>

        <Reveal className="bb-whatis__lede">
          <p>
            BharatBuddy is a digital platform for a connected India — a single place where
            your interests, your language and your region meet the people, communities and
            opportunities that matter to you.
          </p>
        </Reveal>

        <div className="bb-whatis__stage">
          {/* central orb */}
          <div className="bb-whatis__core" aria-hidden="true">
            <div className="bb-whatis__core-ring bb-whatis__core-ring--1" />
            <div className="bb-whatis__core-ring bb-whatis__core-ring--2" />
            <span className="bb-whatis__core-mark">
              <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                <circle cx="24" cy="16" r="6.5" fill="#8b7bff" />
                <circle cx="14" cy="28.5" r="4" fill="#8b7bff" opacity="0.85" />
                <circle cx="34" cy="28.5" r="4" fill="#4f7cff" opacity="0.85" />
                <path d="M20.2 21.5 14.4 25.4M27.8 21.5l5.8 3.9M24 22.5v5" stroke="#cdc5ff" strokeWidth="1.6" />
              </svg>
            </span>
          </div>

          {CARDS.map((c, i) => (
            <div className={`bb-whatis__card bb-whatis__card--${i + 1}`} key={c.label} data-cursor="grow">
              <i className={c.icon} aria-hidden="true" />
              <div>
                <strong>{c.label}</strong>
                <small>{c.note}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
