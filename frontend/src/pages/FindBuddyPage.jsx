import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import UserAvatar from '../components/UserAvatar';
import { InterestChip, LanguageChip } from '../components/Chips';
import UserProfileModal from '../components/UserProfileModal';
import { ReportModal, BlockModal } from '../components/Modals';
import BuddyOrbit3D from '../components/BuddyOrbit3D';

export default function FindBuddyPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(0);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [reportUserTarget, setReportUserTarget] = useState(null);
  const [blockUserTarget, setBlockUserTarget] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  const handleFindBuddy = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setStage(1);

    const stageTimer = setInterval(() => {
      setStage((prev) => (prev < 4 ? prev + 1 : prev));
    }, 500);

    try {
      const { data } = await api.post('/matching/find');
      setTimeout(() => {
        clearInterval(stageTimer);
        setResult(data.data);
        setLoading(false);
      }, 1500);
    } catch (err) {
      clearInterval(stageTimer);
      setError(err?.response?.data?.message || 'No compatible buddy available right now. Invite a friend or try again in a few moments.');
      setLoading(false);
    }
  };

  const handleEndMatch = async () => {
    if (!result?.matchId) return;
    try {
      await api.post(`/matches/${result.matchId}/end`);
      setActionNotice('Match ended successfully.');
      setResult(null);
    } catch (err) {
      setActionNotice('Failed to end match: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleReportSubmit = async (userId, reason) => {
    try {
      await api.post('/reports', {
        reportedUser: { id: userId },
        reason,
      });
      setActionNotice('Report submitted to moderators.');
    } catch (err) {
      setActionNotice('Failed to submit report: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleBlockConfirm = async (userId) => {
    try {
      await api.post(`/users/${userId}/block`);
      setActionNotice('User blocked.');
      setResult(null);
    } catch (err) {
      setActionNotice('Failed to block user: ' + (err?.response?.data?.message || err.message));
    }
  };

  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    if (typeof val[Symbol.iterator] === 'function') return Array.from(val);
    return [];
  };

  const matchedUser = result?.user;
  const matchInterests = toArray(matchedUser?.interests);
  const matchLanguages = toArray(matchedUser?.languages);

  const currentUserInterests = currentUser?.interests
    ? new Set(toArray(currentUser.interests).map((i) => i.toLowerCase()))
    : new Set();

  return (
    <div className="find-buddy-container">
      {actionNotice && (
        <div className="toast-banner success" onClick={() => setActionNotice('')}>
          <span>{actionNotice}</span>
          <i className="fa-solid fa-xmark text-xs opacity-75"></i>
        </div>
      )}

      {/* HEADER TITLE */}
      <div className="find-buddy-header text-center">
        <span className="brand-badge-pill">BharatBuddy Matchmaker</span>
        <h1>Find Your BharatBuddy</h1>
        <p>Discover someone who shares your interests, language, or passions across India</p>
      </div>

      {!loading && !result && (
        <div className="find-starter-box">
          <div style={{ width: '100%', marginBottom: '24px' }}>
            <BuddyOrbit3D />
          </div>
          <h3>Ready to discover someone new?</h3>
          <p>Our heuristic matching engine evaluates mutual interests, language compatibility, and state proximity.</p>
          <button className="btn-brand primary large" onClick={handleFindBuddy}>
            ✨ Find My Buddy
          </button>
        </div>
      )}

      {/* MATCHING ANIMATION & STAGES */}
      {loading && (
        <div className="matching-loader-card">
          <div className="loader-pulse-ring">
            <i className="fa-solid fa-sparkles text-amber-500 fa-bounce"></i>
          </div>
          <h3>Finding your BharatBuddy...</h3>

          <div className="matching-stages-list">
            <div className={`stage-row ${stage >= 1 ? 'active' : ''}`}>
              <span className="stage-icon">{stage > 1 ? '✓' : '●'}</span>
              <span>Checking your interests</span>
            </div>
            <div className={`stage-row ${stage >= 2 ? 'active' : ''}`}>
              <span className="stage-icon">{stage > 2 ? '✓' : '●'}</span>
              <span>Checking language compatibility</span>
            </div>
            <div className={`stage-row ${stage >= 3 ? 'active' : ''}`}>
              <span className="stage-icon">{stage > 3 ? '✓' : '●'}</span>
              <span>Finding active users</span>
            </div>
            <div className={`stage-row ${stage >= 4 ? 'active' : ''}`}>
              <span className="stage-icon">{stage >= 4 ? '●' : '○'}</span>
              <span>Creating your connection</span>
            </div>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="error-alert-card text-center">
          <div className="error-icon-circle">
            <i className="fa-solid fa-user-slash"></i>
          </div>
          <h3>No Match Found Right Now</h3>
          <p>{error}</p>
          <button className="btn-brand secondary" onClick={handleFindBuddy}>
            <i className="fa-solid fa-rotate-right"></i> Try Finding Again
          </button>
        </div>
      )}

      {/* SUCCESSFUL MATCH CARD */}
      {result && matchedUser && !loading && (
        <div className="match-success-card">
          <div className="match-banner-header">
            <h2>🎉 It's a Match!</h2>
            <p>You and {matchedUser.name} share common passions and language compatibility</p>
          </div>

          <div className="match-profile-body">
            <div className="match-user-header">
              <UserAvatar
                src={matchedUser.profileImage}
                name={matchedUser.name}
                size="xl"
                showOnline={true}
                isOnline={matchedUser.online !== false}
              />
              <div className="match-user-info">
                <h3>
                  {matchedUser.name} {matchedUser.age ? `, ${matchedUser.age}` : ''}
                </h3>
                <p className="match-user-state">
                  <i className="fa-solid fa-location-dot"></i> {matchedUser.state || 'India'}
                </p>
                {matchedUser.bio && <p className="match-user-bio">"{matchedUser.bio}"</p>}
              </div>
            </div>

            {/* COMMON INTERESTS */}
            <div className="match-detail-section">
              <h4>Interests & Passions</h4>
              <div className="chips-row wrap">
                {matchInterests.map((interest) => (
                  <InterestChip
                    key={interest}
                    name={interest}
                    isCommon={currentUserInterests.has(interest.toLowerCase())}
                  />
                ))}
              </div>
            </div>

            {/* LANGUAGES */}
            {matchLanguages.length > 0 && (
              <div className="match-detail-section">
                <h4>Languages</h4>
                <div className="chips-row wrap">
                  {matchLanguages.map((lang) => (
                    <LanguageChip key={lang} name={lang} />
                  ))}
                </div>
              </div>
            )}

            {/* ICEBREAKER QUESTION */}
            {result.icebreaker && (
              <div className="icebreaker-callout-box">
                <div className="icebreaker-header">
                  <i className="fa-solid fa-lightbulb text-amber-500"></i>
                  <span>Conversation Starter</span>
                </div>
                <p className="icebreaker-question">"{result.icebreaker}"</p>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="match-actions-row">
              <button
                className="btn-brand primary large"
                onClick={() => navigate(`/connections?matchId=${result.matchId}`)}
              >
                💬 Start Chat
              </button>
              <button
                className="btn-brand outline large"
                onClick={() => setShowProfileModal(true)}
              >
                👤 View Profile
              </button>
              <button className="btn-brand danger outline large" onClick={handleEndMatch}>
                ❌ End Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {matchedUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          user={matchedUser}
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
          onStartChat={() => navigate(`/connections?matchId=${result.matchId}`)}
          onReport={(u) => setReportUserTarget(u)}
          onBlock={(u) => setBlockUserTarget(u)}
        />
      )}

      {/* REPORT & BLOCK MODALS */}
      <ReportModal
        isOpen={Boolean(reportUserTarget)}
        user={reportUserTarget}
        onClose={() => setReportUserTarget(null)}
        onSubmit={handleReportSubmit}
      />

      <BlockModal
        isOpen={Boolean(blockUserTarget)}
        user={blockUserTarget}
        onClose={() => setBlockUserTarget(null)}
        onConfirm={handleBlockConfirm}
      />
    </div>
  );
}
