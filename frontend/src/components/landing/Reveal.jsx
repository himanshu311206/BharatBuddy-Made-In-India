import { useRef, useEffect } from 'react';
import { gsap } from './gsapSetup';

/**
 * Reveal — fades + slides its children in when scrolled into view (once).
 * Skipped entirely when the user prefers reduced motion.
 */
export default function Reveal({ children, className = '', delay = 0, y = 44, scale = 1 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y, scale },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, y, scale]);

  return (
    <div ref={ref} className={`bb-reveal ${className}`}>
      {children}
    </div>
  );
}
