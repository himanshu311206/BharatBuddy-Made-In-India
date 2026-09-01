import { useRef, useEffect } from 'react';
import { gsap } from './gsapSetup';

/**
 * Abstract "Connecting Bharat" node network.
 * Deliberately NOT a political map — a constellation of glowing nodes,
 * echoing the shape of the subcontinent without geographic claims.
 */
const NODES = [
  { x: 42, y: 62, l: 'Srinagar' },
  { x: 58, y: 74, l: 'Delhi NCR' },
  { x: 74, y: 92, l: 'Jaipur' },
  { x: 50, y: 108, l: 'Ahmedabad' },
  { x: 62, y: 130, l: 'Mumbai' },
  { x: 92, y: 96, l: 'Lucknow' },
  { x: 108, y: 108, l: 'Kolkata' },
  { x: 88, y: 138, l: 'Hyderabad' },
  { x: 78, y: 160, l: 'Bengaluru' },
  { x: 92, y: 178, l: 'Chennai' },
  { x: 108, y: 160, l: 'Kochi' },
  { x: 88, y: 62, l: 'Chandigarh' },
];

// indexes into NODES — drawn as connection lines
const LINKS = [
  [0, 1], [0, 11], [1, 2], [1, 6], [1, 11],
  [2, 5], [3, 4], [3, 5], [4, 7], [5, 6],
  [6, 7], [6, 8], [6, 9], [7, 8], [8, 9], [8, 10], [9, 10], [2, 3],
];

function buildPoints() {
  // map abstract node space (114x190) into the 220x200 viewBox
  return NODES.map((n) => ({
    ...n,
    px2: Math.round((n.x / 114) * 200 + 10),
    py2: Math.round((n.y / 190) * 186 + 7),
  }));
}

export default function BharatNetwork() {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bb-bn [data-head]',
        { opacity: 0, y: 44 },
        {
          opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 74%', once: true },
        }
      );
      gsap.fromTo(
        '.bb-bn__node',
        { opacity: 0, scale: 0.4 },
        {
          opacity: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: 'back.out(2.2)',
          scrollTrigger: { trigger: '.bb-bn__visual', start: 'top 80%', once: true },
        }
      );
      gsap.fromTo(
        '.bb-bn__link',
        { strokeDashoffset: 320 },
        {
          strokeDashoffset: 0, duration: 1.5, stagger: 0.1, ease: 'power1.inOut',
          scrollTrigger: { trigger: '.bb-bn__visual', start: 'top 80%', once: true },
        },
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Use stroke-dash animation instead of drawSVG (free plugin avoided).
  const pts = buildPoints();

  return (
    <section className="bb-bn" ref={rootRef}>
      <div className="bb-bn__glow" aria-hidden="true" />
      <p className="bb-eyebrow bb-eyebrow--center" data-head>One Bharat</p>
      <h2 className="bb-display bb-bn__heading" data-head>
        Connecting <span>Bharat.</span>
      </h2>
      <p className="bb-bn__lede" data-head>
        Nodes light up across the country — people, cities, communities and opportunities —
        all reachable through one network.
      </p>

      <div className="bb-bn__visual" data-head>
        <svg viewBox="0 0 220 200" className="bb-bn__svg" role="img" aria-label="Abstract network of connected nodes across India">
          <g className="bb-bn__links">
            {LINKS.map(([a, b], i) => {
              const A = pts[a];
              const B = pts[b];
              return (
                <line
                  key={i}
                  className="bb-bn__link"
                  x1={A.px2} y1={A.py2} x2={B.px2} y2={B.py2}
                />
              );
            })}
          </g>
          <g className="bb-bn__nodes">
            {pts.map((n, i) => (
              <g key={i} className="bb-bn__node">
                <circle className="bb-bn__nodeHalo" cx={n.px2} cy={n.py2} r="10" />
                <circle className="bb-bn__nodeCore" cx={n.px2} cy={n.py2} r="3.2" />
                {n.l && (
                  <text className="bb-bn__label" x={n.px2 + 8} y={n.py2 + 3}>{n.l}</text>
                )}
              </g>
            ))}
          </g>
        </svg>

        <div className="bb-bn__legend" aria-hidden="true">
          <span><i className="bb-bn__legend-dot bb-bn__legend-dot--people" /> People</span>
          <span><i className="bb-bn__legend-dot bb-bn__legend-dot--city" /> Cities</span>
          <span><i className="bb-bn__legend-dot bb-bn__legend-dot--opp" /> Opportunities</span>
        </div>
      </div>
    </section>
  );
}
