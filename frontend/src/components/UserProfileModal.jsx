import UserAvatar from './UserAvatar';
import { InterestChip, LanguageChip } from './Chips';

export default function UserProfileModal({ user, currentUser, isOpen, onClose, onStartChat, onReport, onBlock }) {
  if (!isOpen || !user) return null;

  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    if (typeof val[Symbol.iterator] === 'function') return Array.from(val);
    return [];
  };

  const currentInterests = currentUser?.interests
    ? new Set(toArray(currentUser.interests).map((i) => i.toLowerCase()))
    : new Set();

  const userInterests = toArray(user.interests);
  const userLanguages = toArray(user.languages);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-profile" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="profile-modal-header">
          <UserAvatar
            src={user.profileImage}
            name={user.name}
            size="xl"
            showOnline={true}
            isOnline={user.online !== false}
          />
          <h2 className="modal-profile-name">
            {user.name} {user.age ? `, ${user.age}` : ''}
            {user.verified !== false && (
              <span className="verified-badge-pill" style={{ marginLeft: '8px', fontSize: '13px' }} title="Verified Safe Profile">
                <i className="fa-solid fa-shield-check" style={{ color: '#10b981', marginRight: '3px' }}></i> Verified
              </span>
            )}
          </h2>
          <p className="modal-profile-state">
            <i className="fa-solid fa-location-dot"></i> {user.state || 'India'}
          </p>
        </div>

        {user.bio && (
          <div className="modal-section">
            <h4>About</h4>
            <p className="modal-profile-bio">"{user.bio}"</p>
          </div>
        )}

        <div className="modal-section">
          <h4>Interests</h4>
          <div className="chips-row wrap">
            {userInterests.map((interest) => (
              <InterestChip
                key={interest}
                name={interest}
                isCommon={currentInterests.has(interest.toLowerCase())}
              />
            ))}
          </div>
        </div>

        {userLanguages.length > 0 && (
          <div className="modal-section">
            <h4>Languages</h4>
            <div className="chips-row wrap">
              {userLanguages.map((lang) => (
                <LanguageChip key={lang} name={lang} />
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions-bar">
          <button
            className="btn-brand primary full"
            onClick={() => {
              onClose();
              if (onStartChat) onStartChat(user);
            }}
          >
            <i className="fa-solid fa-comments"></i> Start Conversation
          </button>
          <div className="modal-secondary-actions">
            <button
              className="btn-brand text danger"
              onClick={() => {
                onClose();
                if (onBlock) onBlock(user);
              }}
            >
              <i className="fa-solid fa-ban"></i> Block User
            </button>
            <button
              className="btn-brand text text-muted"
              onClick={() => {
                onClose();
                if (onReport) onReport(user);
              }}
            >
              <i className="fa-solid fa-flag"></i> Report Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
