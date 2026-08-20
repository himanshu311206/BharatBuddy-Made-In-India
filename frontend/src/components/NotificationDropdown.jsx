import { useState, useRef, useEffect } from 'react';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const notifications = [
    { id: 1, title: 'Rahul is online', desc: 'Your connection from Karnataka is active now.', time: '2m ago', icon: 'fa-user-check', unread: true },
    { id: 2, title: 'New Match Found!', desc: 'Priya Sharma shares Coding & Music with you.', time: '1h ago', icon: 'fa-sparkles', unread: true },
    { id: 3, title: 'Message received', desc: 'Ananya sent you a culture icebreaker response.', time: '3h ago', icon: 'fa-comments', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="nav-icon-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <span className="text-xs text-muted">{unreadCount} unread</span>
          </div>

          <div className="notification-list">
            {notifications.map((item) => (
              <div key={item.id} className={`notification-item ${item.unread ? 'unread' : ''}`}>
                <div className="notification-icon">
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <div className="notification-content">
                  <p className="notification-title">{item.title}</p>
                  <p className="notification-desc">{item.desc}</p>
                  <span className="notification-time">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
