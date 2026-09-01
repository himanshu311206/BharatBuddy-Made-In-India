import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import UserAvatar from '../components/UserAvatar';
import { InterestChip } from '../components/Chips';
import UserProfileModal from '../components/UserProfileModal';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/States';
import { ReportModal, BlockModal } from '../components/Modals';

export default function MatchesPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE or ENDED
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [reportUserTarget, setReportUserTarget] = useState(null);
  const [blockUserTarget, setBlockUserTarget] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/matches');
      setMatches(data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleEndMatch = async (matchId) => {
    try {
      await api.post(`/matches/${matchId}/end`);
      setActionNotice('Match ended and moved to previous matches.');
      fetchMatches();
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
      setActionNotice('Report submitted.');
    } catch (err) {
      setActionNotice('Failed to submit report: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleBlockConfirm = async (userId) => {
    try {
      await api.post(`/users/${userId}/block`);
      setActionNotice('User blocked.');
      fetchMatches();
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

  const getOtherUser = (match) => {
    if (!match) return null;
    return match.user1?.id === currentUser?.id ? match.user2 : match.user1;
  };

  const activeMatches = matches.filter((m) => m.status === 'ACTIVE');
  const previousMatches = matches.filter((m) => m.status === 'ENDED');

  const displayedMatches = activeTab === 'ACTIVE' ? activeMatches : previousMatches;

  const currentUserInterests = currentUser?.interests
    ? new Set(toArray(currentUser.interests).map((i) => i.toLowerCase()))
    : new Set();

  return (
    <div className="matches-page-container">
      {actionNotice && (
        <div className="toast-banner success" onClick={() => setActionNotice('')}>
          <span>{actionNotice}</span>
          <i className="fa-solid fa-xmark text-xs opacity-75"></i>
        </div>
      )}

      <div className="matches-header">
        <div>
          <h1>Your Matches</h1>
          <p className="subtitle">Connect and converse with compatible buddies across India</p>
        </div>
        <button className="btn-brand primary" onClick={() => navigate('/find')}>
          ✨ Find New Buddy
        </button>
      </div>

      {/* SAFETY TIP SHIELD BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
        border: '1px solid #bae6fd',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#0369a1'
      }}>
        <i className="fa-solid fa-shield-halved" style={{ fontSize: '20px', color: '#0284c7' }}></i>
        <div>
          <strong>BharatBuddy Safety Shield Active:</strong> Never share sensitive details (OTP, passwords, bank numbers) with strangers. Temporary & fake email domains are blocked. Look for the <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Verified</span> badge.
        </div>
      </div>

      {/* TABS */}
      <div className="matches-tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Active Matches ({activeMatches.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'ENDED' ? 'active' : ''}`}
          onClick={() => setActiveTab('ENDED')}
        >
          Previous Matches ({previousMatches.length})
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMatches} />
      ) : displayedMatches.length === 0 ? (
        <EmptyState
          icon={activeTab === 'ACTIVE' ? 'fa-heart-crack' : 'fa-history'}
          title={activeTab === 'ACTIVE' ? 'No active matches' : 'No previous matches'}
          message={
            activeTab === 'ACTIVE'
              ? 'You have no active matches right now. Launch Find Buddy to match with someone compatible!'
              : 'You have no ended match history.'
          }
          actionText={activeTab === 'ACTIVE' ? 'Find My Buddy' : null}
          onAction={() => navigate('/find')}
        />
      ) : (
        <div className="matches-cards-grid">
          {displayedMatches.map((match) => {
            const other = getOtherUser(match);
            if (!other) return null;

            const otherInterests = toArray(other.interests);

            return (
              <div key={match.id} className="match-card-item">
                <div className="match-card-header">
                  <UserAvatar
                    src={other.profileImage}
                    name={other.name}
                    size="lg"
                    showOnline={true}
                    isOnline={other.online !== false}
                  />
                  <div className="match-card-meta">
                    <div className="match-card-title-row">
                      <h4>{other.name}</h4>
                      <span className={`status-badge ${match.status === 'ACTIVE' ? 'active' : 'ended'}`}>
                        {match.status === 'ACTIVE' ? 'Active' : 'Ended'}
                      </span>
                    </div>
                    <p className="match-card-location">
                      <i className="fa-solid fa-location-dot"></i> {other.state || 'India'}
                    </p>
                  </div>
                </div>

                {other.bio && <p className="match-card-bio">"{other.bio}"</p>}

                <div className="match-card-tags">
                  <div className="chips-row">
                    {otherInterests.slice(0, 3).map((interest) => (
                      <InterestChip
                        key={interest}
                        name={interest}
                        isCommon={currentUserInterests.has(interest.toLowerCase())}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>

                <div className="match-card-actions">
                  {match.status === 'ACTIVE' ? (
                    <>
                      <button
                        className="btn-brand primary text-sm"
                        onClick={() => navigate(`/connections?matchId=${match.id}`)}
                      >
                        💬 Open Chat
                      </button>
                      <button
                        className="btn-brand outline text-sm"
                        onClick={() => setSelectedProfileUser(other)}
                      >
                        Profile
                      </button>
                      <button
                        className="btn-brand danger text text-sm"
                        onClick={() => handleEndMatch(match.id)}
                      >
                        End Match
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-brand outline text-sm full"
                        onClick={() => setSelectedProfileUser(other)}
                      >
                        View Profile History
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      <UserProfileModal
        isOpen={Boolean(selectedProfileUser)}
        user={selectedProfileUser}
        currentUser={currentUser}
        onClose={() => setSelectedProfileUser(null)}
        onStartChat={(u) => navigate('/connections')}
        onReport={(u) => setReportUserTarget(u)}
        onBlock={(u) => setBlockUserTarget(u)}
      />

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
