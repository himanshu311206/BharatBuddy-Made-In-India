import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile drawer whenever a link is clicked.
  const close = () => setOpen(false);

  return (
    <header className={`bb-nav ${scrolled ? 'bb-nav--scrolled' : ''}`} ref={navRef}>
      <div className="bb-nav__inner">
        <Link to="/" className="bb-nav__brand" onClick={close} aria-label="BharatBuddy home">
          <span className="bb-nav__mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="30" height="30" fill="none">
              <circle cx="24" cy="16" r="6.5" fill="#8b7bff" />
              <circle cx="14" cy="28.5" r="4" fill="#8b7bff" opacity="0.85" />
              <circle cx="34" cy="28.5" r="4" fill="#4f7cff" opacity="0.85" />
              <path d="M20.2 21.5 14.4 25.4M27.8 21.5l5.8 3.9M24 22.5v5" stroke="#cdc5ff" strokeWidth="1.6" />
            </svg>
          </span>
          <span className="bb-nav__name">
            Bharat<span>Buddy</span>
          </span>
        </Link>

        <nav className={`bb-nav__links ${open ? 'is-open' : ''}`} aria-label="Landing navigation">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="bb-nav__link" onClick={close}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="bb-nav__actions">
          <Link to="/login" className="bb-nav__login" onClick={close}>
            Log in
          </Link>
          <Link to="/register" className="bb-btn bb-btn--primary bb-btn--sm" onClick={close}>
            Get Started
          </Link>
          <button
            type="button"
            className={`bb-nav__burger ${open ? 'is-open' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
