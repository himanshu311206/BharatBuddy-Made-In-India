import { useState } from 'react';

export function ReportModal({ isOpen, user, onClose, onSubmit }) {
  const [reason, setReason] = useState('Inappropriate behavior');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) return;
    setSubmitting(true);
    try {
      await onSubmit(user.id, finalReason);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const reportReasons = [
    'Spam',
    'Harassment',
    'Fake profile',
    'Inappropriate behavior',
    'Other',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        <h3>Report {user.name}</h3>
        <p className="modal-subtitle">Help us keep BharatBuddy safe for everyone.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label>Reason for report</label>
            <div className="radio-group-vertical">
              {reportReasons.map((r) => (
                <label key={r} className="radio-item">
                  <input
                    type="radio"
                    name="reportReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Other' && (
            <div className="form-group">
              <label>Provide additional details</label>
              <textarea
                rows="3"
                className="input-field"
                placeholder="Explain what happened..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            </div>
          )}

          <div className="modal-button-row">
            <button type="button" className="btn-brand outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-brand danger" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BlockModal({ isOpen, user, onClose, onConfirm }) {
  const [blocking, setBlocking] = useState(false);

  if (!isOpen || !user) return null;

  const handleBlock = async () => {
    setBlocking(true);
    try {
      await onConfirm(user.id);
      onClose();
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card text-center" onClick={(e) => e.stopPropagation()}>
        <div className="warning-icon-badge">
          <i className="fa-solid fa-ban"></i>
        </div>
        <h3>Block {user.name}?</h3>
        <p className="modal-subtitle" style={{ margin: '12px 0 20px' }}>
          Are you sure you want to block this user? You will no longer match or receive messages from them.
        </p>

        <div className="modal-button-row justify-center">
          <button className="btn-brand outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-brand danger" onClick={handleBlock} disabled={blocking}>
            {blocking ? 'Blocking...' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  );
}
