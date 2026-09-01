import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import Globe3DCanvas from '../components/Globe3DCanvas';
import { gsap } from 'gsap';

import '../styles/auth-premium.css';
import '../styles/register-cinema.css';

const defaultInterests = [
  'Coding', 'Gaming', 'Cricket', 'Football', 'Music', 'Movies',
  'Travel', 'Books', 'Art', 'Technology', 'Startups', 'Fitness', 'Study', 'Photography'
];

const defaultLanguages = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali'
];

const indianStates = [
  'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh',
  'Gujarat', 'West Bengal', 'Rajasthan', 'Kerala', 'Punjab', 'Bihar', 'Madhya Pradesh',
  'Haryana', 'Odisha', 'Assam', 'Goa', 'Uttarakhand', 'Jharkhand', 'Himachal Pradesh'
];

const trustedDomains = [
  'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com',
  'icloud.com', 'live.com', 'msn.com', 'protonmail.com', 'proton.me',
  'zoho.com', 'rediffmail.com', 'gmx.com', 'yandex.com', 'bharatbuddy.com'
];

const avatarPresets = ['Priya', 'Rahul', 'Aarav', 'Ananya', 'Vikram', 'Sneha'];

export default function RegisterCinemaPage() {
  const navigate = useNavigate();
  const { register, login, setUser } = useAuth();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Profile
  const [age, setAge] = useState('');
  const [state, setState] = useState('Delhi');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Step 3: Interests / Step 4: Languages
  const [selectedInterests, setSelectedInterests] = useState(['Coding', 'Cricket']);
  const [selectedLanguages, setSelectedLanguages] = useState(['Hindi', 'English']);

  const stageRef = useRef(null);
  const panelRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  // Darken the app document behind the cinematic stage
  useEffect(() => {
    document.body.classList.add('bb-auth-doc');
    return () => document.body.classList.remove('bb-auth-doc');
  }, []);

  // GSAP entrance timeline
  useEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;

      gsap.fromTo(
        '.rc-orb',
        { opacity: 0, scale: 0.4 },
        { opacity: 1, scale: 1, duration: 1.4, stagger: 0.18, ease: 'power2.out' }
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 46, scale: 0.94, filter: 'blur(10px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.9 }
      );
      gsap.fromTo(
        '.rc-brand-row',
        { opacity: 0, y: -14 },
        { opacity: 1, y: 0, duration: 0.55, delay: 0.35 }
      );
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.45 }
      );
      gsap.fromTo(
        '.rc-body',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.65, delay: 0.6 }
      );
      gsap.fromTo(
        '.rc-chip',
        { opacity: 0, scale: 0.7, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.7, stagger: 0.1, delay: 0.7, ease: 'back.out(1.7)' }
      );
    }, stageRef);
    return () => ctx.revert();
  }, []);

  // Animate panel when step changes
  useEffect(() => {
    if (bodyRef.current) {
      const node = bodyRef.current;
      node.classList.remove('rc-step-anim');
      // Force a reflow so the animation can restart
      void node.offsetWidth;
      node.classList.add('rc-step-anim');
    }
  }, [step]);

  const toggleInterest = (item) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleLanguage = (item) => {
    setSelectedLanguages((prev) =>
      prev.includes(item) ? prev.filter((language) => language !== item) : [...prev, item]
    );
  };

  const isDisposableEmail = (em) => {
    if (!em || !em.includes('@')) return true;
    const domain = em.split('@')[1].toLowerCase().trim();
    if (trustedDomains.includes(domain)) return false;
    if (domain.endsWith('.edu') || domain.endsWith('.edu.in') || domain.endsWith('.ac.in') || domain.endsWith('.gov.in')) return false;
    return true;
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', score: 0, color: '#ccc' };
    if (pass.length < 6) return { label: 'Weak (Min 6 chars)', score: 1, color: '#ef4444' };
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    if (hasLetter && hasNum && hasSpecial) return { label: 'Strong Security', score: 3, color: '#10b981' };
    if (hasLetter && hasNum) return { label: 'Medium', score: 2, color: '#f59e0b' };
    return { label: 'Fair', score: 1, color: '#f59e0b' };
  };

  const isValidIndianMobile = (num) => /^[6-9]\d{9}$/.test(num.trim());

  const scrollBodyToTop = () => {
    if (bodyRef.current) {
      bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please fill in all account fields.');
      return;
    }
    if (isDisposableEmail(email)) {
      setError('Temporary, fake, or disposable emails are blocked to prevent fake profiles. Please use a real email (e.g. Gmail, Yahoo, Outlook).');
      return;
    }
    if (!isValidIndianMobile(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6-9).');
      return;
    }
    if (password.length < 6) {
      setError('For security, password must be at least 6 characters long.');
      return;
    }
    setStep(2);
    scrollBodyToTop();
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    setStep(3);
    scrollBodyToTop();
  };

  const handleNextStep3 = (e) => {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest.');
      return;
    }
    setError('');
    setStep(4);
    scrollBodyToTop();
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (selectedLanguages.length === 0) {
      setError('Please select at least one language.');
      return;
    }

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
      await login(email.trim(), password);
      const activeAvatar = profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim() || 'Buddy')}`;
      await api.put('/users/me', {
        name: name.trim(),
        age: age ? Number(age) : null,
        state,
        bio: bio.trim(),
        profileImage: activeAvatar,
        interests: selectedInterests,
        languages: selectedLanguages,
      });

      const { data } = await api.get('/users/me');
      setUser(data.data);
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
        setError(msg || 'Registration failed. Please check your details or try a different email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const activeAvatar = profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'Buddy')}`;

  const steps = [
    { label: 'Account', icon: 'fa-user' },
    { label: 'Profile', icon: 'fa-user-pen' },
    { label: 'Interests', icon: 'fa-heart' },
    { label: 'Languages', icon: 'fa-language' },
  ];

  return (
    <div className="auth-cinema rc-register" ref={stageRef}>
      {/* Layered cinematic backdrop */}
      <div className="auth-cinema__bg">
        <i className="orb--saffron rc-orb"></i>
        <i className="orb--indigo rc-orb"></i>
        <i className="orb--emerald rc-orb"></i>
        <i className="orb--pink rc-orb"></i>
      </div>
      <div className="auth-cinema__grid"></div>
      <div className="auth-cinema__globe"><Globe3DCanvas /></div>
      <div className="auth-cinema__veil"></div>
      <div className="pa-halo"></div>

      {/* Floating stat chips */}
      <div className="cinema-float cf-chip cf--1 rc-chip">
        <span className="cf-ico"><i className="fa-solid fa-flag"></i></span>
        <div><b>28+ States</b><span>Across India</span></div>
      </div>
      <div className="cinema-float cf-chip cf--2 rc-chip">
        <span className="cf-ico cf-ico--indigo"><i className="fa-solid fa-comments"></i></span>
        <div><b>Real-time</b><span>Chat & calls</span></div>
      </div>
      <div className="cinema-float cf-chip cf--3 rc-chip">
        <span className="cf-ico cf-ico--emerald"><i className="fa-solid fa-shield-halved"></i></span>
        <div><b>0 Fake</b><span>Verified profiles</span></div>
      </div>
      <div className="cinema-float cf-chip cf--4 rc-chip">
        <span className="cf-ico"><i className="fa-solid fa-wand-magic-sparkles"></i></span>
        <div><b>AI Buddy</b><span>Smart matching</span></div>
      </div>

      {/* Wide glass panel */}
      <div className="pa-panel pa-panel--wide rc-panel" ref={panelRef}>
        <div className="pa-brand rc-brand-row">
          <span className="pa-brand-flag">🇮🇳</span>
          <span className="pa-brand-name">BharatBuddy</span>
          <Link to="/" className="pa-back-home">
            <i className="fa-solid fa-arrow-left"></i> Home
          </Link>
        </div>

        <div ref={titleRef}>
          <div className="pa-kicker">Create Free Account</div>
          <h1 className="pa-title">
            Join <span className="pa-title-grad">BharatBuddy</span>
          </h1>
          <p className="pa-sub">Create your profile in under a minute and start making friends across India.</p>
        </div>

        {/* Stepper */}
        <div className="wizard-stepper rc-stepper">
          {steps.map((s, i) => {
            const num = i + 1;
            const isActive = step >= num;
            const isCompleted = step > num;
            const statusClass = isCompleted ? 'completed' : isActive ? 'active' : '';
            return (
              <span key={s.label} className="rc-step-group">
                <span className={`step-item rc-step-item ${statusClass}`}>
                  <span className="step-num rc-step-num">
                    {isCompleted ? <i className="fa-solid fa-check"></i> : num}
                  </span>
                  <span className="step-label rc-step-label">
                    <i className={`fa-solid ${s.icon}`}></i> {s.label}
                  </span>
                </span>
                {num < steps.length && <span className="step-line rc-step-line"></span>}
              </span>
            );
          })}
        </div>

        <div className="rc-body" ref={bodyRef}>
          {error && (
            <div className="auth-alert error rc-fade-in">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="auth-alert success rc-fade-in">
              <i className="fa-solid fa-shield-check"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: ACCOUNT */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="wizard-step-body">
              <div className="rc-hint-bar">
                <i className="fa-solid fa-user-shield"></i>
                Real profiles only — fake or temporary emails are blocked.
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-icon-wrapper">
                    <i className="fa-solid fa-user input-prefix-icon"></i>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-icon-wrapper">
                    <i className="fa-solid fa-envelope input-prefix-icon"></i>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {email && isDisposableEmail(email) && (
                    <div className="auth-field-hint">
                      <i className="fa-solid fa-triangle-exclamation"></i> Temporary or fake email domain detected!
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Mobile Number</label>
                  <div className="input-icon-wrapper">
                    <i className="fa-solid fa-mobile-screen input-prefix-icon"></i>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                    />
                  </div>
                  {phone && !isValidIndianMobile(phone) && (
                    <div className="auth-field-hint">
                      <i className="fa-solid fa-triangle-exclamation"></i> Enter a valid 10-digit Indian mobile (starting with 6-9).
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-icon-wrapper">
                    <i className="fa-solid fa-lock input-prefix-icon"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-input"
                      placeholder="Create password (min 6 chars)"
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
                  {password && (
                    <div className="security-level">
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>Security Level:</span>
                      <b style={{ color: getPasswordStrength(password).color }}>
                        {getPasswordStrength(password).label}
                      </b>
                    </div>
                  )}
                </div>
              </div>

              <div className="wizard-actions rc-actions">
                <Link to="/login" className="pa-link-btn">
                  Already have an account? Sign In
                </Link>
                <button type="submit" className="pa-btn">
                  Continue <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PROFILE */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="wizard-step-body">
              <div className="avatar-picker-section">
                <img src={activeAvatar} alt="Avatar Preview" className="wizard-avatar-preview" />
                <div>
                  <label>Choose Avatar Style</label>
                  <div className="avatar-presets-grid">
                    {avatarPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="preset-chip"
                        onClick={() => setProfileImage(`https://api.dicebear.com/7.x/bottts/svg?seed=${preset}`)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Age</label>
                  <div className="input-icon-wrapper">
                    <i className="fa-solid fa-cake-candles input-prefix-icon"></i>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 23"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>State / Region</label>
                  <div className="input-icon-wrapper">
                    <i className="fa-solid fa-location-dot input-prefix-icon"></i>
                    <select
                      className="form-select"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      {indianStates.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Short Bio</label>
                <div className="input-icon-wrapper">
                  <i className="fa-solid fa-pen-nib input-prefix-icon"></i>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="What do you build, play, or watch on weekends?"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              <div className="wizard-actions rc-actions">
                <button type="button" className="pa-btn pa-btn--ghost" onClick={() => setStep(1)}>
                  <i className="fa-solid fa-arrow-left"></i> Back
                </button>
                <button type="submit" className="pa-btn">
                  Continue to Interests <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: INTERESTS */}
          {step === 3 && (
            <form onSubmit={handleNextStep3} className="wizard-step-body">
              <div className="step-prompt-box">
                <h3>Select your Interests & Passions</h3>
                <p>Pick what you love discussing or working on ({selectedInterests.length} selected)</p>
              </div>

              <div className="chip-picker-grid">
                {defaultInterests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      className={`picker-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      <i className={`fa-solid ${isSelected ? 'fa-check' : 'fa-plus'}`}></i>
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>

              <div className="wizard-actions rc-actions">
                <button type="button" className="pa-btn pa-btn--ghost" onClick={() => setStep(2)}>
                  <i className="fa-solid fa-arrow-left"></i> Back
                </button>
                <button type="submit" className="pa-btn">
                  Continue to Languages <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: LANGUAGES */}
          {step === 4 && (
            <form onSubmit={handleFinalSubmit} className="wizard-step-body">
              <div className="step-prompt-box">
                <h3>Select your Languages</h3>
                <p>Pick languages you feel comfortable speaking ({selectedLanguages.length} selected)</p>
              </div>

              <div className="chip-picker-grid">
                {defaultLanguages.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      className={`picker-chip language ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleLanguage(lang)}
                    >
                      <i className={`fa-solid ${isSelected ? 'fa-check' : 'fa-plus'}`}></i>
                      <span>{lang}</span>
                    </button>
                  );
                })}
              </div>

              <div className="wizard-actions rc-actions">
                <button type="button" className="pa-btn pa-btn--ghost" onClick={() => setStep(3)}>
                  <i className="fa-solid fa-arrow-left"></i> Back
                </button>
                <button type="submit" className="pa-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Creating Profile...
                    </>
                  ) : (
                    <>
                      Create my BharatBuddy profile <i className="fa-solid fa-rocket"></i>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        <div className="auth-footer-prompt rc-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
