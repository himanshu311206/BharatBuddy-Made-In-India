import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="login-split-page">
      {/* LEFT SPLIT HERO SECTION */}
      <div className="login-hero-pane">
        <div className="login-hero-glow"></div>
        <div className="login-hero-content">
          <div className="login-brand-header">
            <span className="login-flag-icon">🇮🇳</span>
            <span className="login-brand-name">BharatBuddy</span>
          </div>

          <div className="login-quote-box">
            <h1>
              One country.<br />
              Millions of stories.<br />
              <span className="highlight-text">Your next friend could be anywhere.</span>
            </h1>
            <p>
              Connect with authentic people across Indian states based on real passions, dialects, and mutual curiosity.
            </p>
          </div>

          {/* ABSTRACT INDIA GRAPHIC / STATS */}
          <div className="login-hero-badges">
            <div className="hero-stat-badge">
              <strong>28+</strong>
              <span>States Covered</span>
            </div>
            <div className="hero-stat-badge">
              <strong>100%</strong>
              <span>Real-Time Chat</span>
            </div>
            <div className="hero-stat-badge">
              <strong>0</strong>
              <span>Fake Profiles</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT FORM PANE */}
      <div className="login-form-pane">
        <div className="login-card-container">
          <div className="login-card-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue discovering BharatBuddies</p>
          </div>

          {error && (
            <div className="auth-alert error">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-body">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-icon-wrapper">
                <i className="fa-solid fa-envelope input-prefix-icon"></i>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="password">Password</label>
              </div>
              <div className="input-icon-wrapper">
                <i className="fa-solid fa-lock input-prefix-icon"></i>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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

            <button type="submit" className="btn-brand primary full large" disabled={loading}>
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

          {/* DEMO ACCOUNTS HELPER */}
          <div className="demo-accounts-card">
            <div className="demo-title">
              <i className="fa-solid fa-key text-amber-500"></i> Demo Account Available:
            </div>
            <div className="demo-buttons-group">
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => fillDemoAccount('priya@bharatbuddy.com', 'User@123')}
              >
                Priya (User)
              </button>
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => fillDemoAccount('rahul@bharatbuddy.com', 'User@123')}
              >
                Rahul (User)
              </button>
              <button
                type="button"
                className="demo-chip-btn"
                onClick={() => fillDemoAccount('admin@bharatbuddy.com', 'Admin@123')}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="auth-footer-prompt">
            <p>
              Don't have an account yet?{' '}
              <Link to="/register" className="auth-link-bold">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
