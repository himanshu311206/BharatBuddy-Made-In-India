import { Link } from 'react-router-dom';

const COLS = [
  {
    title: 'Platform',
    links: [
      { label: 'Find a Buddy', to: '/find' },
      { label: 'Matches', to: '/matches' },
      { label: 'Connections', to: '/connections' },
      { label: 'Profile', to: '/profile' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Home', to: '/' },
      { label: 'What is BharatBuddy?', to: '/' },
      { label: 'Features', to: '/' },
      { label: 'How it works', to: '/' },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="bb-footer">
      <div className="bb-footer__inner">
        <div className="bb-footer__brand">
          <Link to="/" className="bb-nav__brand" aria-label="BharatBuddy home">
            <span className="bb-nav__mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="28" height="28" fill="none">
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
          <p className="bb-footer__tagline">
            One place to connect with people, discover opportunities and experience a more connected Bharat.
          </p>
        </div>

        {COLS.map((col) => (
          <div className="bb-footer__col" key={col.title}>
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="bb-footer__col">
          <h4>Get started</h4>
          <p className="bb-footer__cta-text">Create your free profile and start connecting today.</p>
          <Link to="/register" className="bb-btn bb-btn--primary bb-btn--sm">
            Get Started
          </Link>
        </div>
      </div>

      <div className="bb-footer__bottom">
        <p>© {new Date().getFullYear()} BharatBuddy · Designed &amp; Developed with ❤️ in India</p>
        <p>Helpline: 345632567</p>
      </div>
    </footer>
  );
}
