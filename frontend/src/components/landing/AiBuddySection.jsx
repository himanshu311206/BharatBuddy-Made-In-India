import { useEffect, useRef, useState } from 'react';
import { gsap } from './gsapSetup';
import useReducedMotion from './useReducedMotion';

/**
 * AI Buddy showcase — a looping mock conversation.
 * This is a VISUAL DEMONSTRATION only; it does not fake real
 * application behaviour (the real assistant widget stays wired).
 */
const STEPS = [
  { type: 'user', text: "What's interesting around me?" },
  { type: 'typing' },
  { type: 'ai', text: 'Here are a few things you might enjoy…' },
  { type: 'chips', items: ['Rooftop café meetup', 'Local coding circle', 'Weekend heritage walk'] },
];

export default function AiBuddySection() {
  const rootRef = useRef(null);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bb-aibuddy [data-head]',
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 75%', once: true },
        }
      );
      gsap.fromTo(
        '.bb-aibuddy__frame',
        { opacity: 0, y: 60, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.bb-aibuddy__frame', start: 'top 82%', once: true },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  // Only start the chat loop once the frame is on screen.
  useEffect(() => {
    if (reduced) return;
    if (!rootRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.35 }
    );
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, [reduced]);

  const inViewRef = useRef(true);
  useEffect(() => {
    if (reduced) return;
    if (!visible) return;
    inViewRef.current = true;
    const t = setInterval(() => {
      if (!inViewRef.current) return;
      setStep((s) => (s + 1) % STEPS.length);
    }, 2400);
    const onScroll = () => {
      const r = rootRef.current?.getBoundingClientRect();
      inViewRef.current = !!r && r.top < window.innerHeight * 0.9 && r.bottom > 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearInterval(t);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduced, visible]);

  return (
    <section className="bb-aibuddy" ref={rootRef}>
      <p className="bb-eyebrow bb-eyebrow--center" data-head>AI Buddy</p>
      <h2 className="bb-display bb-aibuddy__heading" data-head>
        Your AI Buddy is <span>Always Around.</span>
      </h2>

      <div className="bb-aibuddy__layout">
        {/* Voice-wave / pulse visual */}
        <div className="bb-aibuddy__orb-wrap" data-head aria-hidden="true">
          <div className="bb-aibuddy__orb">
            <div className="bb-aibuddy__orb-core">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M5 9v6M9 6v12M13 4v16M17 7v10M21 10v4" />
              </svg>
            </div>
            <span className="bb-aibuddy__pulse bb-aibuddy__pulse--1" />
            <span className="bb-aibuddy__pulse bb-aibuddy__pulse--2" />
            <span className="bb-aibuddy__pulse bb-aibuddy__pulse--3" />
          </div>
          <div className="bb-aibuddy__bars" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <i key={i} style={{ '--i': i }} />
            ))}
          </div>
          <p className="bb-aibuddy__caption">Always listening. Always helping.</p>
        </div>

        {/* Chat frame */}
        <div className="bb-aibuddy__frame" data-head>
          <div className="bb-aibuddy__frame-head">
            <span className="bb-aibuddy__avatar" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="26" height="26" fill="none">
                <circle cx="24" cy="16" r="6.5" fill="#8b7bff" />
                <circle cx="14" cy="28.5" r="4" fill="#8b7bff" opacity="0.85" />
                <circle cx="34" cy="28.5" r="4" fill="#4f7cff" opacity="0.85" />
              </svg>
            </span>
            <div>
              <p className="bb-aibuddy__frame-name"><span className="bb-online-dot" /> Bharat AI Buddy</p>
              <p className="bb-aibuddy__frame-sub">online · ready to help</p>
            </div>
            <span className="bb-aibuddy__frame-live">live demo</span>
          </div>

          <div className="bb-aibuddy__chat">
            {STEPS[step].type === 'user' && (
              <div className="bb-aibuddy__msg bb-aibuddy__msg--user">{STEPS[step].text}</div>
            )}
            {STEPS[step].type === 'typing' && (
              <div className="bb-aibuddy__msg bb-aibuddy__msg--ai">
                <span className="bb-typing"><i /><i /><i /></span>
              </div>
            )}
            {STEPS[step].type === 'ai' && (
              <div className="bb-aibuddy__msg bb-aibuddy__msg--ai">{STEPS[step].text}</div>
            )}
            {STEPS[step].type === 'chips' && (
              <div className="bb-aibuddy__chips">
                {STEPS[step].items.map((c) => (
                  <span className="bb-aibuddy__chip" key={c}>{c}</span>
                ))}
              </div>
            )}
          </div>

          <div className="bb-aibuddy__frame-foot">
            <span className="bb-aibuddy__input-placeholder">Ask anything…</span>
            <span className="bb-aibuddy__send" aria-hidden="true">
              <i className="fa-solid fa-arrow-up" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
