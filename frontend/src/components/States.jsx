export function LoadingSkeleton({ type = 'card', count = 3 }) {
  if (type === 'card') {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-line title"></div>
            <div className="skeleton-line sub"></div>
            <div className="skeleton-tags">
              <div className="skeleton-tag"></div>
              <div className="skeleton-tag"></div>
            </div>
            <div className="skeleton-button"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="skeleton-list">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton-avatar sm"></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton-line title"></div>
              <div className="skeleton-line sub"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-box">
      <div className="skeleton-line title"></div>
      <div className="skeleton-line sub"></div>
    </div>
  );
}

export function EmptyState({ icon = 'fa-compass', title = 'No data found', message, actionText, onAction }) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionText && onAction && (
        <button className="btn-brand primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message = 'Please check your connection and try again.', onRetry }) {
  return (
    <div className="error-state-card">
      <div className="error-state-icon">
        <i className="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn-brand secondary" onClick={onRetry}>
          <i className="fa-solid fa-rotate-right"></i> Try Again
        </button>
      )}
    </div>
  );
}
