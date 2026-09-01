import { useRef, useEffect } from 'react';
import { gsap } from './gsapSetup';

const DEFAULT_STRENGTH = 0.3;

export default function Magnetic({ children, strength = DEFAULT_STRENGTH, className = '' }) {
  const innerRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const inner = innerRef.current;
    const root = rootRef.current;
    if (!inner || !root) return;

    // Let CSS (bb-magnetic wrapper) handle the layout; we only move the inner.
    const xTo = gsap.quickTo(inner, 'x', { duration: 0.4, ease: 'expo.out' });
    const yTo = gsap.quickTo(inner, 'y', { duration: 0.4, ease: 'expo.out' });
    const sTo = gsap.quickTo(inner, 'scale', { duration: 0.3, ease: 'power2.out' });

    const move = (e) => {
      const rect = root.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo(relX * strength);
      yTo(relY * strength);
    };

    const enter = () => {
      sTo(1.045);
      root.classList.add('is-hover');
    };

    const leave = () => {
      xTo(0);
      yTo(0);
      sTo(1);
      root.classList.remove('is-hover');
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!reduced.matches) {
      root.addEventListener('pointermove', move, { passive: true });
      root.addEventListener('pointerenter', enter);
      root.addEventListener('pointerleave', leave);
    }
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointerleave', leave);
      xTo(0);
      yTo(0);
      sTo(1);
    };
  }, [strength]);

  return (
    <span
      ref={rootRef}
      className={`bb-magnetic${className ? ` ${className}` : ''}`}
      data-magnetic
    >
      <span ref={innerRef} className="bb-magnetic__inner">
        {children}
      </span>
    </span>
  );
}
