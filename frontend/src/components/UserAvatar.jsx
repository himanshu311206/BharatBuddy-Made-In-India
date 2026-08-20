export default function UserAvatar({ src, name, size = 'md', showOnline = false, isOnline = false, className = '' }) {
  const fallbackSeed = encodeURIComponent(name || 'User');
  const avatarSrc = src || `https://api.dicebear.com/7.x/bottts/svg?seed=${fallbackSeed}`;

  const sizeMap = {
    sm: '36px',
    md: '48px',
    lg: '72px',
    xl: '96px',
  };

  const dimension = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-block flex-shrink-0 ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      <img
        src={avatarSrc}
        alt={name || 'User Avatar'}
        className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm"
        style={{ width: dimension, height: dimension, borderRadius: '50%', objectFit: 'cover' }}
        onError={(e) => {
          e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${fallbackSeed}`;
        }}
      />
      {showOnline && (
        <span
          className={`avatar-online-dot ${isOnline ? 'online' : 'offline'}`}
          title={isOnline ? 'Online now' : 'Offline'}
        />
      )}
    </div>
  );
}
