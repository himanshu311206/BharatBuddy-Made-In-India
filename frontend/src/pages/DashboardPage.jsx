import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import UserCard from '../components/UserCard';
import UserProfileModal from '../components/UserProfileModal';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/States';
import { ReportModal, BlockModal } from '../components/Modals';
import BuddyOrbit3D from '../components/BuddyOrbit3D';
import Interactive3DCard from '../components/Interactive3DCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [reportUserTarget, setReportUserTarget] = useState(null);
  const [blockUserTarget, setBlockUserTarget] = useState(null);
  const [actionNotice, setActionMessage] = useState('');

  const fetchOnlineUsers = async () => {
    setLoadingUsers(true);
    setError('');
    try {
      const { data } = await api.get('/users/online');
      setOnlineUsers(data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load online buddies.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
  }, []);

  const handleConnect = async (targetUser) => {
    navigate('/find');
  };

  const handleReportSubmit = async (userId, reason) => {
    try {
      await api.post('/reports', {
        reportedUser: { id: userId },
        reason,
      });
      setActionMessage('Report submitted successfully.');
    } catch (err) {
      setActionMessage('Failed to submit report: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleBlockConfirm = async (userId) => {
    try {
      await api.post(`/users/${userId}/block`);
      setActionMessage('User blocked successfully.');
      fetchOnlineUsers();
    } catch (err) {
      setActionMessage('Failed to block user: ' + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div className="dashboard-container">
      {/* ACTION NOTICE TOAST */}
      {actionNotice && (
        <div className="toast-banner success" onClick={() => setActionMessage('')}>
          <span>{actionNotice}</span>
          <i className="fa-solid fa-xmark text-xs opacity-75"></i>
        </div>
      )}

      {/* WELCOME BANNER SECTION */}
      <section className="dashboard-welcome-banner">
        <div className="welcome-text-group">
          <div className="status-live-tag">
            <span className="live-dot-glow"></span> Discoverable across India
          </div>
          <h1 className="welcome-heading">
            Namaste, {user?.name ? user.name.split(' ')[0] : 'Explorer'} 👋
          </h1>
          <p className="welcome-subtext">Ready to meet someone new today?</p>
        </div>
        <div className="dashboard-signal-deck" aria-label="BharatBuddy live network status">
          <div className="signal-stat">
            <span className="signal-stat-icon"><i className="fa-solid fa-satellite-dish"></i></span>
            <span><strong>LIVE</strong><small>Network pulse</small></span>
          </div>
          <div className="signal-stat">
            <span className="signal-stat-icon signal-stat-icon--cyan"><i className="fa-solid fa-bolt"></i></span>
            <span><strong>24/7</strong><small>Buddy energy</small></span>
          </div>
          <div className="signal-stat">
            <span className="signal-stat-icon signal-stat-icon--violet"><i className="fa-solid fa-route"></i></span>
            <span><strong>28+</strong><small>States connected</small></span>
          </div>
        </div>
      </section>

      {/* MAIN HERO CARD */}
      <section className="hero-find-card">
        <div className="hero-find-card__scanlines" aria-hidden="true"></div>
        <div style={{ marginBottom: '20px' }}>
          <BuddyOrbit3D candidates={onlineUsers} />
        </div>
        <div className="hero-find-content">
          <span className="brand-badge-pill">BharatBuddy Matchmaker</span>
          <h2>Find Your BharatBuddy</h2>
          <p>
            Discover someone who shares your interests, language or passions from anywhere across India.
          </p>

          <div className="hero-find-buttons">
            <Link to="/find" className="btn-brand primary large">
              ✨ Find My Buddy
            </Link>
            <Link to="/matches" className="btn-brand outline large">
              View Matches
            </Link>
          </div>
        </div>
      </section>

      {/* PEOPLE ONLINE NOW SECTION */}
      <section className="online-users-section">
        <div className="section-header-row">
          <div>
            <h3>People Online Now</h3>
            <p className="section-subtext">
              Active members ready to connect and converse
            </p>
          </div>
          <button
            className="btn-brand text text-sm"
            onClick={fetchOnlineUsers}
            disabled={loadingUsers}
          >
            <i className={`fa-solid fa-rotate-right ${loadingUsers ? 'fa-spin' : ''}`}></i> Refresh
          </button>
        </div>

        {loadingUsers ? (
          <LoadingSkeleton type="card" count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchOnlineUsers} />
        ) : onlineUsers.length === 0 ? (
          <EmptyState
            icon="fa-users-slash"
            title="No buddies currently available"
            message="No active members are online right now. Be the first to start a discovery search!"
            actionText="Find My Buddy"
            onAction={() => navigate('/find')}
          />
        ) : (
          <div className="user-cards-grid">
            {onlineUsers.map((onlineUser) => (
              <Interactive3DCard key={onlineUser.id}>
                <UserCard
                  user={onlineUser}
                  currentUser={user}
                  onViewProfile={(u) => setSelectedProfileUser(u)}
                  onConnect={(u) => handleConnect(u)}
                />
              </Interactive3DCard>
            ))}
          </div>
        )}
      </section>

      {/* USER PROFILE MODAL */}
      <UserProfileModal
        isOpen={Boolean(selectedProfileUser)}
        user={selectedProfileUser}
        currentUser={user}
        onClose={() => setSelectedProfileUser(null)}
        onStartChat={() => navigate('/find')}
        onReport={(u) => setReportUserTarget(u)}
        onBlock={(u) => setBlockUserTarget(u)}
      />

      {/* REPORT MODAL */}
      <ReportModal
        isOpen={Boolean(reportUserTarget)}
        user={reportUserTarget}
        onClose={() => setReportUserTarget(null)}
        onSubmit={handleReportSubmit}
      />

      {/* BLOCK MODAL */}
      <BlockModal
        isOpen={Boolean(blockUserTarget)}
        user={blockUserTarget}
        onClose={() => setBlockUserTarget(null)}
        onConfirm={handleBlockConfirm}
      />
    </div>
  );
}
