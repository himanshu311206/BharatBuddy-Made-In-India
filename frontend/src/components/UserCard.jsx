import UserAvatar from './UserAvatar';
import { InterestChip, LanguageChip } from './Chips';

export default function UserCard({ user, currentUser, onViewProfile, onConnect }) {
  if (!user) return null;

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

  const commonCount = userInterests.filter((i) => currentInterests.has(i.toLowerCase())).length;

  return (
    <div className="user-card-item">
      <div className="user-card-header">
        <UserAvatar
          src={user.profileImage}
          name={user.name}
          size="lg"
          showOnline={true}
          isOnline={user.online !== false}
        />
        <div className="user-card-meta">
          <div className="user-card-name-row">
            <h4 className="user-card-name">{user.name}</h4>
            {user.verified !== false && (
              <span className="verified-badge-pill" title="Verified Safe Profile">
                <i className="fa-solid fa-shield-check" style={{ color: '#10b981', marginRight: '3px' }}></i> Verified
              </span>
            )}
            {user.age && <span className="user-card-age">{user.age}</span>}
          </div>
          <p className="user-card-location">
            <i className="fa-solid fa-location-dot"></i> {user.state || 'India'}
          </p>
          {commonCount > 0 && (
            <span className="common-interests-badge">
              <i className="fa-solid fa-sparkles"></i> {commonCount} Shared Passions
            </span>
          )}
        </div>
      </div>

      {user.bio && <p className="user-card-bio">"{user.bio}"</p>}

      <div className="user-card-tags">
        <div className="user-card-section-label">Interests</div>
        <div className="chips-row">
          {userInterests.slice(0, 4).map((interest) => (
            <InterestChip
              key={interest}
              name={interest}
              isCommon={currentInterests.has(interest.toLowerCase())}
              size="sm"
            />
          ))}
          {userInterests.length > 4 && (
            <span className="more-chips-tag">+{userInterests.length - 4} more</span>
          )}
        </div>

        {userLanguages.length > 0 && (
          <div className="chips-row" style={{ marginTop: '6px' }}>
            {userLanguages.slice(0, 2).map((lang) => (
              <LanguageChip key={lang} name={lang} size="sm" />
            ))}
          </div>
        )}
      </div>

      <div className="user-card-actions">
        <button
          className="btn-brand outline text-sm"
          onClick={() => onViewProfile && onViewProfile(user)}
        >
          View Profile
        </button>
        <button
          className="btn-brand primary text-sm"
          onClick={() => onConnect && onConnect(user)}
        >
          <i className="fa-solid fa-user-plus"></i> Connect
        </button>
      </div>
    </div>
  );
}
