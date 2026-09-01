import { useEffect, useRef, useState } from 'react';
import useReducedMotion from './useReducedMotion';

/**
 * Brief cinematic intro: BharatBuddy mark + "Connecting Bharat…"
 * then a smooth reveal into the hero. Never longer than ~2s.
 */
const TOTAL_MS = 1700;
const LEAVE_MS = 640;

export default function Preloader({ onDone }) {
  const reduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(() => doneRef.current?.(), 120);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setLeaving(true), TOTAL_MS);
    const t2 = setTimeout(() => doneRef.current?.(), TOTAL_MS + LEAVE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduced]);

  return (
    <div
      className={`bb-preloader ${leaving ? 'bb-preloader--leave' : ''}`}
      role="status"
      aria-label="Loading BharatBuddy"
    >
      <div className="bb-preloader__inner">
        <div className="bb-preloader__mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="46" height="46" fill="none">
            <defs>
              <linearGradient id="bb-mark-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8b7bff" />
                <stop offset="1" stopColor="#4f7cff" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" stroke="url(#bb-mark-g)" strokeWidth="1.5" opacity="0.5" />
            <circle cx="24" cy="18" r="7" fill="url(#bb-mark-g)" />
            <circle cx="14.5" cy="29" r="4.2" fill="#8b7bff" opacity="0.85" />
            <circle cx="33.5" cy="29" r="4.2" fill="#4f7cff" opacity="0.85" />
            <path d="M20.5 23 14.5 26.5M27.5 23l6 3.5M24 25v4" stroke="url(#bb-mark-g)" strokeWidth="1.4" />
          </svg>
        </div>
        <p className="bb-preloader__name">
          Bharat<span>Buddy</span>
        </p>
        <p className="bb-preloader__text">Connecting Bharat<span className="bb-dots"><i /><i /><i /></span></p>
      </div>
    </div>
  );
}
