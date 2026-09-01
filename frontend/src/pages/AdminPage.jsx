import { useEffect, useState } from 'react';
import api from '../services/api';
import Interactive3DCard from '../components/Interactive3DCard';

export default function AdminPage() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, suspendedUsers: 0, totalReports: 0, matches: 0, reports: [], users: [] });
  const [message, setMessage] = useState('');
  const [apiLatency, setApiLatency] = useState(null);

  const load = async () => {
    const startTime = performance.now();
    try {
      const { data } = await api.get('/admin/dashboard');
      const endTime = performance.now();
      setApiLatency(Math.round(endTime - startTime));
      setStats(data.data || { totalUsers: 0, activeUsers: 0, suspendedUsers: 0, totalReports: 0, matches: 0, reports: [], users: [] });
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
        <Interactive3DCard>
          <div className="dash-tile-3d glass-panel" style={{ height: '100%' }}>
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
        </Interactive3DCard>

        <Interactive3DCard>
          <div className="dash-tile-3d glass-panel" style={{ height: '100%' }}>
            <i className="fa-solid fa-flag tile-watermark"></i>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              All Reports
            </span>
            <strong style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: '#DC2626' }}>
              {stats.totalReports}
            </strong>
            <span style={{ fontSize: '0.82rem', color: '#B91C1C', fontWeight: 600 }}>
              {stats.reports?.length || 0} pending review
            </span>
          </div>
        </Interactive3DCard>

        <Interactive3DCard>
          <div className="dash-tile-3d glass-panel" style={{ height: '100%' }}>
            <i className="fa-solid fa-signal tile-watermark"></i>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Active Online Buddies
            </span>
            <strong style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>
              {stats.activeUsers}
            </strong>
            <span style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 600 }}>
              ● Real-Time WebSocket Ready
            </span>
          </div>
        </Interactive3DCard>

        <Interactive3DCard>
          <div className="dash-tile-3d glass-panel" style={{ height: '100%' }}>
            <i className="fa-solid fa-bolt tile-watermark"></i>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              API Ping Latency
            </span>
            <strong style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: '#6366F1' }}>
              {apiLatency !== null ? `${apiLatency} ms` : 'Testing...'}
            </strong>
            <span style={{ fontSize: '0.82rem', color: apiLatency < 100 ? '#16A34A' : '#D97706', fontWeight: 600 }}>
              {apiLatency < 100 ? '⚡ Ultra Low Latency' : '● Operational'}
            </span>
          </div>
        </Interactive3DCard>
      </div>

      {/* USER DIRECTORY */}
      <div className="glass-panel admin-user-directory" style={{ padding: '32px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>Community Directory</h2>
            <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '4px' }}>Every registered account and current moderation status.</p>
          </div>
          <span className="brand-badge">{stats.suspendedUsers || 0} blocked</span>
        </div>
        <div className="admin-user-table-wrap">
          <table className="admin-user-table">
            <thead>
              <tr><th>User</th><th>Contact</th><th>Location</th><th>Status</th><th>Joined</th><th>Action</th></tr>
            </thead>
            <tbody>
              {(stats.users || []).map((communityUser) => (
                <tr key={communityUser.id}>
                  <td><strong>{communityUser.name || 'Unnamed user'}</strong></td>
                  <td><span>{communityUser.email}</span><small>{communityUser.phone || 'No phone'}</small></td>
                  <td>{communityUser.state || 'India'}</td>
                  <td><span className={`admin-status ${communityUser.suspended ? 'blocked' : communityUser.online ? 'online' : 'offline'}`}><i className="fa-solid fa-circle"></i> {communityUser.suspended ? 'Blocked' : communityUser.online ? 'Active' : 'Offline'}</span></td>
                  <td>{communityUser.createdAt ? new Date(communityUser.createdAt).toLocaleDateString() : '-'}</td>
                  <td>{communityUser.suspended ? <span className="admin-muted-action">Blocked</span> : <button className="btn-3d btn-3d-secondary small danger" onClick={() => handleSuspend(communityUser.id, communityUser.email)}><i className="fa-solid fa-ban"></i> Block</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
