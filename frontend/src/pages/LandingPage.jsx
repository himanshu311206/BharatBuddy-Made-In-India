import { useState } from 'react';
import { Link } from 'react-router-dom';
import Globe3DCanvas from '../components/Globe3DCanvas';
import Interactive3DCard from '../components/Interactive3DCard';

const features = [
  {
    icon: 'fa-solid fa-brain',
    color: 'var(--grad-saffron)',
    title: 'Smart 3D Match Heuristic',
    desc: 'Deep interest-scoring algorithm matches you with buddies who share your passions, languages, and regional vibes.',
  },
  {
    icon: 'fa-solid fa-shield-halved',
    color: 'var(--grad-emerald)',
    title: 'Safe & Verified Circles',
    desc: 'Zero-tolerance moderation, instant blocking, and human-in-the-loop report resolution keep your space authentic.',
  },
  {
    icon: 'fa-solid fa-comments',
    color: 'var(--grad-indigo)',
    title: 'Real-Time 3D Chat',
    desc: 'Instant messaging with conversation history, read receipts, and fun Indian cultural icebreakers.',
  },
  {
    icon: 'fa-solid fa-globe',
    color: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
    title: 'Pan-India Cultural Discovery',
    desc: 'Make friends from Kerala to Kashmir, exchange regional stories, food traditions, and tech ideas.',
  },
];

const faqs = [
  {
    q: 'How does the Bharat Buddy matching algorithm work?',
    a: 'We calculate a weighted compatibility score using your common interests (+10 pts each), shared languages (+8 pts), regional affinity, and real-time online status to find you the most genuine connection.',
  },
  {
    q: 'Is my personal information and privacy safe?',
    a: 'Absolutely. Your phone number and email are never shared publicly. We enforce strict JWT stateless authorization and provide instant block and report tools on every match.',
  },
  {
    q: 'Can I choose which languages and interests I want to match with?',
    a: 'Yes! You can customize all your interests (Coding, Gaming, Travel, Startups, Cricket) and regional languages anytime from your 3D profile.',
  },
  {
    q: 'What happens when a match is ended?',
    a: 'Ending a match securely archives the conversation and removes the buddy from your active circle without deleting your account.',
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="landing-page">
      {/* 3D HERO SECTION */}
      <section className="hero-3d-section">
        <div className="hero-content">
          <div className="hero-badge-pill">
            <span>✨</span> Next-Gen Social Discovery across 28 States & 8 UTs
          </div>

          <h1 className="hero-title">
            Find Your <span className="text-grad-saffron">Bharat Buddy</span> in 3D
          </h1>

          <p className="hero-subtitle">
            Experience the new way to discover like-minded friends, study partners, and startup collaborators across India with smart AI-driven compatibility.
          </p>

          <div className="hero-cta-group">
            <Link to="/register" className="btn-3d btn-3d-primary large">
              <i className="fa-solid fa-rocket"></i> Find My Buddy Now
            </Link>
            <Link to="/login" className="btn-3d btn-3d-secondary large">
              Sign In
            </Link>
          </div>

          <div className="hero-stats-strip">
            <div className="hero-stat-item">
              <strong>15,000+</strong>
              <span>Active Buddies</span>
            </div>
            <div className="hero-stat-item">
              <strong>98.4%</strong>
              <span>Match Satisfaction</span>
            </div>
            <div className="hero-stat-item">
              <strong>28</strong>
              <span>States Connected</span>
            </div>
          </div>
        </div>

        {/* 3D Mockup Visual */}
        <div className="hero-3d-visual" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', height: '320px', marginBottom: '-40px' }}>
            <Globe3DCanvas />
          </div>

          <div className="floating-3d-tag tag-pos-1">
            <span style={{ fontSize: '1.2rem' }}>🎮</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Common Passion</div>
              <strong>Gaming & Tech</strong>
            </div>
          </div>

          <div className="floating-3d-tag tag-pos-2">
            <span style={{ fontSize: '1.2rem' }}>☕</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Icebreaker Ready</div>
              <strong>"Best chai in Delhi?"</strong>
            </div>
          </div>

          <Interactive3DCard style={{ width: '100%', maxWidth: '380px' }}>
            <div className="hero-3d-main-card">
              <div className="hero-card-header">
                <span className="brand-badge">MATCH CANDIDATE</span>
                <span className="status-pill-live">
                  <span className="pulse-dot"></span> Online Now
                </span>
              </div>

              <div className="hero-buddy-profile">
                <div className="buddy-avatar-ring">
                  <img
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=Aarav"
                    alt="Aarav"
                  />
                </div>
                <h3>Aarav Sharma, 22</h3>
                <p>📍 Maharashtra, India • Tech & Coffee Explorer</p>
              </div>

              <div className="compatibility-meter">
                <div className="meter-header">
                  <span>Compatibility Score</span>
                  <strong className="text-grad-saffron">98% Match</strong>
                </div>
                <div className="meter-bar">
                  <div className="meter-fill"></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <span className="pill-tag-3d">💻 Coding</span>
                <span className="pill-tag-3d">🏏 Cricket</span>
                <span className="pill-tag-3d">🗣️ Hindi & English</span>
              </div>
            </div>
          </Interactive3DCard>
        </div>
      </section>

      {/* 3D FEATURE GRID */}
      <section className="section-shell">
        <div className="section-head">
          <span className="hero-badge-pill" style={{ margin: '0 auto 16px' }}>🚀 POWERED BY SMART HEURISTICS</span>
          <h2>Why People Love Bharat Buddy</h2>
          <p>Designed from the ground up for meaningful, genuine friendships across cultural backgrounds.</p>
        </div>

        <div className="features-3d-grid">
          {features.map((feat, idx) => (
            <Interactive3DCard key={idx}>
              <div className="feature-3d-card" style={{ height: '100%' }}>
                <div className="feature-icon-box" style={{ background: feat.color, color: 'white' }}>
                  <i className={feat.icon}></i>
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            </Interactive3DCard>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS 3D STEPS */}
      <section className="section-shell" style={{ background: 'rgba(255, 255, 255, 0.5)', padding: '60px 24px', borderRadius: '32px' }}>
        <div className="section-head">
          <span className="hero-badge-pill" style={{ margin: '0 auto 16px' }}>⚡ 3 EASY STEPS</span>
          <h2>How Bharat Buddy Works</h2>
          <p>Get started in less than 60 seconds with zero complicated setup.</p>
        </div>

        <div className="features-3d-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="feature-3d-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="feature-icon-box" style={{ background: 'var(--grad-saffron)', color: 'white' }}>
              <strong>1</strong>
            </div>
            <h3>Build Your Profile</h3>
            <p>Pick your favorite hobbies, favorite Indian languages, state, and a fun bio.</p>
          </div>

          <div className="feature-3d-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="feature-icon-box" style={{ background: 'var(--grad-indigo)', color: 'white' }}>
              <strong>2</strong>
            </div>
            <h3>Discover 3D Match</h3>
            <p>Our matching engine matches you with active buddies holding high affinity scores.</p>
          </div>

          <div className="feature-3d-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="feature-icon-box" style={{ background: 'var(--grad-emerald)', color: 'white' }}>
              <strong>3</strong>
            </div>
            <h3>Chat & Connect</h3>
            <p>Break the ice with cultural questions and converse in real-time securely.</p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="section-shell">
        <div className="section-head">
          <span className="hero-badge-pill" style={{ margin: '0 auto 16px' }}>❓ GOT QUESTIONS?</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about Bharat Buddy and community safety.</p>
        </div>

        <div className="faq-accordion-list">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="faq-item-card" onClick={() => setOpenFaq(isOpen ? -1 : idx)}>
                <div className="faq-q-row">
                  <span>{item.q}</span>
                  <i className={`fa-solid ${isOpen ? 'fa-circle-minus text-grad-saffron' : 'fa-circle-plus'}`}></i>
                </div>
                {isOpen && <p className="faq-answer">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="section-shell" style={{ textAlign: 'center' }}>
        <div className="feature-3d-card" style={{ background: 'var(--grad-dark-glass)', color: 'white', padding: '60px 32px' }}>
          <h2 style={{ color: 'white', fontSize: '2.4rem', marginBottom: '16px' }}>
            Ready to Meet Your Next Great Indian Buddy?
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 28px' }}>
            Join thousands of students, developers, travelers, and creators making genuine connections today.
          </p>
          <div>
            <Link to="/register" className="btn-3d btn-3d-primary large">
              <i className="fa-solid fa-sparkles"></i> Create Free Account
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '40px 24px', color: '#64748B', fontSize: '0.9rem' }}>
        <p>© 2026 Bharat Buddy 🇮🇳 • Designed with pride for authentic connections.</p>
      </footer>
    </div>
  );
}
