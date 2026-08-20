import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminPage() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, matches: 0, reports: [], reportedUsers: [] });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.data || { totalUsers: 0, activeUsers: 0, matches: 0, reports: [], reportedUsers: [] });
    } catch (err) {
      setMessage('Failed to load admin dashboard: ' + (err?.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleResolve = async (reportId) => {
    try {
      await api.post(`/admin/reports/${reportId}/resolve`);
      setMessage(`Report #${reportId} marked as resolved.`);
      load();
    } catch (err) {
      setMessage('Error resolving report: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleSuspend = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to suspend user ${userEmail || userId}?`)) return;
    try {
      await api.post(`/admin/users/${userId}/suspend`);
      setMessage(`User ${userEmail || userId} suspended.`);
      load();
    } catch (err) {
      setMessage('Error suspending user: ' + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div className="section-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span className="hero-badge-pill" style={{ background: '#EEF2FF', color: '#4338CA', marginBottom: '8px' }}>
            🛡️ MODERATION & TELEMETRY
          </span>
          <h1 style={{ fontSize: '2.4rem' }}>Admin Command Center</h1>
        </div>
        <button className="btn-3d btn-3d-secondary small" onClick={load}>
          <i className="fa-solid fa-arrows-rotate"></i> Refresh Metrics
        </button>
      </div>

      {message && (
        <div className="alert-box-3d success" onClick={() => setMessage('')} style={{ cursor: 'pointer' }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{message}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.6 }}>✕</span>
        </div>
      )}

      {/* 3D METRIC TILES */}
      <div className="dashboard-grid-3d">
        <div className="dash-tile-3d glass-panel">
          <i className="fa-solid fa-users tile-watermark"></i>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Registered Users
          </span>
          <strong style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>
            {stats.totalUsers}
          </strong>
          <span style={{ fontSize: '0.82rem', color: '#16A34A', fontWeight: 600 }}>
            ● Verified in Database
          </span>
        </div>

        <div className="dash-tile-3d glass-panel">
          <i className="fa-solid fa-signal tile-watermark"></i>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Active Online Buddies
          </span>
          <strong style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>
            {stats.activeUsers}
          </strong>
          <span style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 600 }}>
            ● Real-Time Ready
          </span>
        </div>

        <div className="dash-tile-3d glass-panel">
          <i className="fa-solid fa-heart tile-watermark"></i>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Total 3D Matches
          </span>
          <strong style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>
            {stats.matches || 0}
          </strong>
          <span style={{ fontSize: '0.82rem', color: '#D97706', fontWeight: 600 }}>
            ● Connections Formed
          </span>
        </div>
      </div>

      {/* REPORTS TRIAGE */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem' }}>
            Pending Safety Reports ({stats.reports?.length || 0})
          </h2>
          <span className="brand-badge" style={{ background: stats.reports?.length ? '#FEE2E2' : '#DCFCE7', color: stats.reports?.length ? '#B91C1C' : '#15803D' }}>
            {stats.reports?.length ? '⚠️ Needs Review' : '✅ Clear'}
          </span>
        </div>

        {stats.reports?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.reports.map((report) => (
              <div
                key={report.id}
                className="feature-3d-card"
                style={{ padding: '20px', borderLeft: '4px solid #EF4444' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>
                    Report #{report.id}
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>

                <p style={{ margin: '8px 0', fontSize: '1rem', color: '#B91C1C', fontWeight: 600 }}>
                  ⚠️ Reason: {report.reason}
                </p>

                <div style={{ display: 'flex', gap: '20px', fontSize: '0.88rem', color: '#475569' }}>
                  <span>
                    <strong>Reporter:</strong> {report.reporter?.email || report.reporter?.name || 'User'}
                  </span>
                  <span>
                    <strong>Reported User:</strong> {report.reportedUser?.email || report.reportedUser?.name || 'User'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button className="btn-3d btn-3d-primary small" onClick={() => handleResolve(report.id)}>
                    <i className="fa-solid fa-check"></i> Mark Resolved
                  </button>
                  {report.reportedUser && (
                    <button
                      className="btn-3d btn-3d-secondary small danger"
                      onClick={() => handleSuspend(report.reportedUser.id, report.reportedUser.email)}
                    >
                      <i className="fa-solid fa-user-slash"></i> Suspend User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🛡️</div>
            <h3>Community is Safe & Clean</h3>
            <p style={{ fontSize: '0.9rem' }}>No pending moderation or safety reports.</p>
          </div>
        )}
      </div>
    </div>
  );
}
