import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';

const defaultInterests = [
  'Coding', 'Gaming', 'Cricket', 'Football', 'Music', 'Movies',
  'Travel', 'Books', 'Art', 'Technology', 'Startups', 'Fitness', 'Study', 'Photography'
];

const defaultLanguages = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi'
];

const indianStates = [
  'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh',
  'Gujarat', 'West Bengal', 'Rajasthan', 'Kerala', 'Punjab', 'Bihar', 'Madhya Pradesh',
  'Haryana', 'Odisha', 'Assam', 'Goa', 'Uttarakhand', 'Jharkhand', 'Himachal Pradesh'
];

const avatarPresets = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Ananya'];

export default function OnboardingPage() {
  const { user } = useAuth();
  return <OnboardingForm key={user?.id ?? 'new'} user={user} />;
}

function OnboardingForm({ user }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    age: user?.age || '',
    state: user?.state || 'Delhi',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
  }));

  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    if (typeof val[Symbol.iterator] === 'function') return Array.from(val);
    return [];
  };

  const initialInterests = user?.interests ? toArray(user.interests) : ['Coding', 'Cricket'];
  const initialLanguages = user?.languages ? toArray(user.languages) : ['Hindi', 'English'];

  const [selectedInterests, setSelectedInterests] = useState(initialInterests);
  const [selectedLanguages, setSelectedLanguages] = useState(initialLanguages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleItem = (item, list, setList) => {
    setList(list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.put('/users/me', {
        ...form,
        age: form.age ? Number(form.age) : null,
        interests: selectedInterests,
        languages: selectedLanguages,
      });
      const { data } = await api.get('/users/me');
      setUser(data.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeAvatar = form.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(form.name || 'Buddy')}`;

  return (
    <div className="section-shell" style={{ maxWidth: '840px' }}>
      <div className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="hero-badge-pill" style={{ margin: '0 auto 12px' }}>
            ✨ STEP 1 OF 1: SETUP YOUR 3D BUDDY CARD
          </span>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '6px' }}>Complete Your Profile</h1>
          <p style={{ color: '#64748B' }}>Help our 3D matching engine discover the best companions for you.</p>
        </div>

        {error && (
          <div className="alert-box-3d error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Avatar Preview & Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', background: 'rgba(241, 245, 249, 0.6)', padding: '20px', borderRadius: '24px' }}>
            <img src={activeAvatar} alt="Avatar" className="match-avatar-3d" style={{ width: '80px', height: '80px' }} />
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Pick 3D Avatar Style
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {avatarPresets.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    className="pill-tag-3d"
                    style={{ cursor: 'pointer', border: '1px solid #E2E8F0', background: 'white' }}
                    onClick={() => setForm({ ...form, profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}` })}
                  >
                    {seed}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div className="form-group">
              <label>Your Name</label>
              <div className="input-3d-wrapper">
                <i className="fa-solid fa-user prefix-icon"></i>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-3d"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Age</label>
              <div className="input-3d-wrapper">
                <i className="fa-solid fa-cake-candles prefix-icon"></i>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="e.g. 21"
                  className="input-3d"
                />
              </div>
            </div>

            <div className="form-group">
              <label>State / Union Territory</label>
              <div className="input-3d-wrapper">
                <i className="fa-solid fa-map-location-dot prefix-icon"></i>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="input-3d"
                  style={{ background: 'white' }}
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
              <label>Custom Profile Image URL (Optional)</label>
              <div className="input-3d-wrapper">
                <i className="fa-solid fa-image prefix-icon"></i>
                <input
                  value={form.profileImage}
                  onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
                  placeholder="https://..."
                  className="input-3d"
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>Short Bio / Vibe</label>
            <div className="input-3d-wrapper">
              <textarea
                rows="3"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Share a fun fact, what you're building, or your favorite chai spot..."
                className="input-3d"
                style={{ padding: '14px 16px', minHeight: '80px' }}
              />
            </div>
          </div>

          {/* Interests Cloud */}
          <div style={{ marginTop: '24px' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              🔥 Select Your Passions & Hobbies ({selectedInterests.length} selected)
            </label>
            <div className="chip-cloud-3d">
              {defaultInterests.map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    className={`chip-3d ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleItem(item, selectedInterests, setSelectedInterests)}
                  >
                    {isSelected ? '✓ ' : '+ '} {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Languages Cloud */}
          <div style={{ marginTop: '24px' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              🗣️ Select Your Languages & Dialects ({selectedLanguages.length} selected)
            </label>
            <div className="chip-cloud-3d">
              {defaultLanguages.map((item) => {
                const isSelected = selectedLanguages.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    className={`chip-3d ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleItem(item, selectedLanguages, setSelectedLanguages)}
                  >
                    {isSelected ? '✓ ' : '+ '} {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <button className="btn-3d btn-3d-primary large full" disabled={loading} type="submit">
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Saving 3D Card...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rocket"></i> Launch My Bharat Buddy Experience
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
