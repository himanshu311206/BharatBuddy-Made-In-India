import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Globe3DCanvas from '../components/Globe3DCanvas';
import { gsap } from 'gsap';

import '../styles/auth-premium.css';

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stageRef = useRef(null);
  const panelRef = useRef(null);
  const titleRef = useRef(null);

  // Darken the app document behind the cinematic stage (restored on unmount).
  useEffect(() => {
    document.body.classList.add('bb-auth-doc');
    return () => document.body.classList.remove('bb-auth-doc');
  }, []);

  // GSAP entrance timeline — panel, title, fields, floats.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        panelRef.current,
        { opacity: 0, y: 46, scale: 0.94, filter: 'blur(10px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.9 }
      )
        .fromTo(
          '.pa-brand-row',
          { opacity: 0, y: -14 },
          { opacity: 1, y: 0, duration: 0.55 },
          '-=0.55'
        )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          '.pa-form-el',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          '-=0.35'
        )
        .fromTo(
          '.pa-demo-el',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.06 },
          '-=0.3'
        );

      gsap.fromTo(
        '.cf-chip',
        { opacity: 0, scale: 0.7, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.7, stagger: 0.12, delay: 0.5, ease: 'back.out(1.7)' }
      );
    }, stageRef);

    return () => ctx.revert();
  }, []);

  const fillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      if (!err?.response) {
        setError('Unable to connect to backend server. Please check if the server is running on port 8080.');
      } else {
        const resData = err?.response?.data;
        let msg = resData?.message;
        if (resData?.errors && typeof resData.errors === 'object') {
          msg = Object.values(resData.errors).join(', ');
        }
        setError(msg || 'Invalid credentials. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-cinema pa-login" ref={stageRef}>
      {/* Layered cinematic backdrop */}
      <div className="auth-cinema__bg">
        <i className="orb--saffron"></i>
        <i className="orb--indigo"></i>
        <i className="orb--emerald"></i>
        <i className="orb--pink"></i>
      </div>
      <div className="auth-cinema__grid"></div>
      <div className="auth-cinema__globe"><Globe3DCanvas /></div>
      <div className="auth-cinema__veil"></div>
      <div className="pa-halo"></div>

      {/* Floating stat chips */}
      <div className="cinema-float cf-chip cf--1">
        <span className="cf-ico"><i className="fa-solid fa-flag"></i></span>
        <div><b>28+ States</b><span>Across India</span></div>
      </div>
      <div className="cinema-float cf-chip cf--2">
        <span className="cf-ico cf-ico--indigo"><i className="fa-solid fa-comments"></i></span>
        <div><b>Real-time</b><span>Chat & calls</span></div>
      </div>
      <div className="cinema-float cf-chip cf--3">
        <span className="cf-ico cf-ico--emerald"><i className="fa-solid fa-shield-halved"></i></span>
        <div><b>0 Fake</b><span>Verified profiles</span></div>
      </div>
      <div className="cinema-float cf-chip cf--4">
        <span className="cf-ico"><i className="fa-solid fa-wand-magic-sparkles"></i></span>
        <div><b>AI Buddy</b><span>Smart matching</span></div>
      </div>

      {/* Glass panel */}
      <div className="pa-panel" ref={panelRef}>
        <div className="pa-brand pa-brand-row">
          <span className="pa-brand-flag">🇮🇳</span>
          <span className="pa-brand-name">BharatBuddy</span>
          <Link to="/" className="pa-back-home">
            <i className="fa-solid fa-arrow-left"></i> Home
          </Link>
        </div>

        <div ref={titleRef}>
          <div className="pa-kicker">Welcome Back</div>
          <h1 className="pa-title">
            Sign in to <span className="pa-title-grad">BharatBuddy</span>
          </h1>
          <p className="pa-sub">Your next friend could be anywhere in India — continue exploring.</p>
        </div>

        {error && (
          <div className="auth-alert error pa-form-el">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-body" autoComplete="on">
          <div className="form-group pa-form-el">
            <label htmlFor="email">Email Address</label>
            <div className="input-icon-wrapper">
              <i className="fa-solid fa-envelope input-prefix-icon"></i>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group pa-form-el">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <i className="fa-solid fa-lock input-prefix-icon"></i>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="pa-btn pa-form-el" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Signing In...
              </>
            ) : (
              <>
                Sign In <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="demo-accounts-card pa-demo-el">
          <div className="demo-title">
            <i className="fa-solid fa-key"></i> One-Click Demo Login:
          </div>
          <div className="demo-buttons-group">
            <button type="button" className="demo-chip-btn" onClick={() => fillDemoAccount('priya@bharatbuddy.com', 'User@123')}>
              Priya (User)
            </button>
            <button type="button" className="demo-chip-btn" onClick={() => fillDemoAccount('rahul@bharatbuddy.com', 'User@123')}>
              Rahul (User)
            </button>
            <button type="button" className="demo-chip-btn" onClick={() => fillDemoAccount('admin@bharatbuddy.com', 'Admin@123')}>
              Admin
            </button>
          </div>
        </div>

        <div className="auth-footer-prompt pa-demo-el">
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="auth-link-bold">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
