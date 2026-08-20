import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';

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

const avatarPresets = ['Priya', 'Rahul', 'Aarav', 'Ananya', 'Vikram', 'Sneha'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, login, setUser } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Profile
  const [age, setAge] = useState('');
  const [state, setState] = useState('Delhi');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState(['Coding', 'Cricket']);

  // Step 4: Languages
  const [selectedLanguages, setSelectedLanguages] = useState(['Hindi', 'English']);

  const toggleInterest = (item) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleLanguage = (item) => {
    setSelectedLanguages((prev) =>
      prev.includes(item) ? prev.filter((l) => l !== item) : [...prev, l]
    );
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all account fields.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleNextStep3 = (e) => {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest.');
      return;
    }
    setError('');
    setStep(4);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedLanguages.length === 0) {
      setError('Please select at least one language.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Register account
      await register({ name: name.trim(), email: email.trim(), password });

      // Step 2: Login
      await login(email.trim(), password);

      // Step 3: Update profile details, interests, languages
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

      // Refresh current user
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

  return (
    <div className="register-wizard-container">
      <div className="wizard-card">
        {/* WIZARD HEADER & PROGRESS INDICATOR */}
        <div className="wizard-header">
          <div className="wizard-brand">
            <span>🇮🇳</span> BharatBuddy Registration
          </div>
          <h2>Create Your Buddy Profile</h2>
          <p className="wizard-subtitle">Discover someone who shares your passions across India</p>

          <div className="wizard-stepper">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-num">01</span>
              <span className="step-label">Account</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-num">02</span>
              <span className="step-label">Profile</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <span className="step-num">03</span>
              <span className="step-label">Interests</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step >= 4 ? 'active' : ''}`}>
              <span className="step-num">04</span>
              <span className="step-label">Languages</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="auth-alert error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: ACCOUNT */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="wizard-step-body">
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
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrapper">
                <i className="fa-solid fa-lock input-prefix-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Create password (min 4 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="wizard-actions">
              <Link to="/login" className="btn-brand text">
                Already have an account? Sign In
              </Link>
              <button type="submit" className="btn-brand primary">
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
                <label className="text-sm font-bold text-gray-700">Choose Avatar Style</label>
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
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 23"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>State / Region</label>
                <select
                  className="form-select"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Short Bio</label>
              <textarea
                rows="3"
                className="form-textarea"
                placeholder="What do you build, play, or watch on weekends?"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="wizard-actions">
              <button type="button" className="btn-brand outline" onClick={() => setStep(1)}>
                <i className="fa-solid fa-arrow-left"></i> Back
              </button>
              <button type="submit" className="btn-brand primary">
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

            <div className="wizard-actions">
              <button type="button" className="btn-brand outline" onClick={() => setStep(2)}>
                <i className="fa-solid fa-arrow-left"></i> Back
              </button>
              <button type="submit" className="btn-brand primary">
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

            <div className="wizard-actions">
              <button type="button" className="btn-brand outline" onClick={() => setStep(3)}>
                <i className="fa-solid fa-arrow-left"></i> Back
              </button>
              <button type="submit" className="btn-brand primary large" disabled={loading}>
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
    </div>
  );
}
