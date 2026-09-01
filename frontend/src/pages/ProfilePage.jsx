import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import UserAvatar from '../components/UserAvatar';
import { InterestChip, LanguageChip } from '../components/Chips';

const defaultInterestsOptions = [
  'Coding', 'Gaming', 'Cricket', 'Football', 'Music', 'Movies',
  'Travel', 'Books', 'Art', 'Technology', 'Startups', 'Fitness', 'Study', 'Photography'
];

const defaultLanguagesOptions = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali'
];

const indianStates = [
  'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh',
  'Gujarat', 'West Bengal', 'Rajasthan', 'Kerala', 'Punjab', 'Bihar', 'Madhya Pradesh',
  'Haryana', 'Odisha', 'Assam', 'Goa', 'Uttarakhand', 'Jharkhand', 'Himachal Pradesh'
];

const avatarPresets = ['Harshit', 'Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Ananya'];

export default function ProfilePage() {
  const { user, setUser } = useAuth();

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

  const [stats, setStats] = useState({ matchCount: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/matches');
        const list = data.data || [];
        setStats({ matchCount: list.length });
      } catch {
        setStats({ matchCount: 0 });
      }
    };
    fetchStats();
  }, []);

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

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaved(false);
    setError('');
    setLoading(true);

    try {
      const { data } = await api.put('/users/me', {
        ...form,
        age: form.age ? Number(form.age) : null,
        interests: selectedInterests,
        languages: selectedLanguages,
      });

      setUser(data.data);
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const userInterests = user?.interests ? toArray(user.interests) : [];
  const userLanguages = user?.languages ? toArray(user.languages) : [];

  return (
    <div className="profile-page-container">
      {saved && (
        <div className="toast-banner success">
          <i className="fa-solid fa-circle-check"></i>
          <span>Profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="toast-banner error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="profile-header-card">
        <div className="profile-avatar-row">
          <UserAvatar
            src={user?.profileImage}
            name={user?.name}
            size="xl"
            showOnline={true}
            isOnline={user?.online !== false}
          />
          <div className="profile-identity-info">
            <h2>
              {user?.name} {user?.age ? `, ${user.age}` : ''}
            </h2>
            <p className="profile-location text-muted">
              <i className="fa-solid fa-location-dot"></i> {user?.state || 'India'}
            </p>
            {user?.bio && <p className="profile-bio-text">"{user.bio}"</p>}
          </div>

          <button
            className="btn-brand outline profile-edit-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            <i className={`fa-solid ${isEditing ? 'fa-xmark' : 'fa-pen-to-square'}`}></i>
            <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* STATS BAR */}
        <div className="profile-stats-grid">
          <div className="stat-tile">
            <span className="stat-value">{stats.matchCount}</span>
            <span className="stat-label">Total Matches</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{userInterests.length}</span>
            <span className="stat-label">Interests</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{userLanguages.length}</span>
            <span className="stat-label">Languages</span>
          </div>
        </div>
      </div>

      {/* VIEW READ-ONLY BADGES */}
      {!isEditing ? (
        <div className="profile-details-grid">
          <div className="profile-section-card">
            <h3>Passions & Interests</h3>
            <div className="chips-row wrap" style={{ marginTop: '12px' }}>
              {userInterests.length > 0 ? (
                userInterests.map((interest) => (
                  <InterestChip key={interest} name={interest} />
                ))
              ) : (
                <p className="text-muted text-sm">No interests added yet.</p>
              )}
            </div>
          </div>

          <div className="profile-section-card">
            <h3>Languages Spoken</h3>
            <div className="chips-row wrap" style={{ marginTop: '12px' }}>
              {userLanguages.length > 0 ? (
                userLanguages.map((lang) => (
                  <LanguageChip key={lang} name={lang} />
                ))
              ) : (
                <p className="text-muted text-sm">No languages added yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* EDIT FORM MODAL / SECTION */
        <div className="profile-edit-section">
          <h3>Edit Profile Details</h3>

          <form onSubmit={handleSave} className="edit-profile-form">
            <div className="avatar-preset-picker">
              <label>Select Avatar Style</label>
              <div className="presets-row">
                {avatarPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="preset-chip"
                    onClick={() =>
                      setForm({
                        ...form,
                        profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${preset}`,
                      })
                    }
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>State / Region</label>
                <select
                  className="form-select"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
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
              <label>Bio</label>
              <textarea
                rows="3"
                className="form-textarea"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Share a quick line about yourself..."
              />
            </div>

            <div className="form-group">
              <label>Edit Interests</label>
              <div className="chip-picker-grid">
                {defaultInterestsOptions.map((item) => {
                  const isSelected = selectedInterests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`picker-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleInterest(item)}
                    >
                      <i className={`fa-solid ${isSelected ? 'fa-check' : 'fa-plus'}`}></i>
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label>Edit Languages</label>
              <div className="chip-picker-grid">
                {defaultLanguagesOptions.map((item) => {
                  const isSelected = selectedLanguages.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`picker-chip language ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleLanguage(item)}
                    >
                      <i className={`fa-solid ${isSelected ? 'fa-check' : 'fa-plus'}`}></i>
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                className="btn-brand outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-brand primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
