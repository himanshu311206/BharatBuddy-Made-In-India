import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import NotificationDropdown from './NotificationDropdown';
import UserAvatar from './UserAvatar';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="global-navbar shadow-sm sticky top-0 z-50">
      <div className="navbar-container">
        {/* BRAND LOGO */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-badge">🇮🇳</div>
          <div className="brand-title-wrap">
            <span className="brand-title-main">BharatBuddy</span>
            <span className="brand-tagline-micro">Crafted by Himanshu</span>
          </div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        {isAuthenticated && (
          <nav className="navbar-links desktop-only">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <i className="fa-solid fa-house"></i> Home
            </NavLink>
            <NavLink to="/find" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <i className="fa-solid fa-compass"></i> Find Buddy
            </NavLink>
            <NavLink to="/matches" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <i className="fa-solid fa-users"></i> Matches
            </NavLink>
            <NavLink to="/connections" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <i className="fa-solid fa-comments"></i> Chat
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <i className="fa-solid fa-user"></i> Profile
            </NavLink>
          </nav>
        )}

        {/* RIGHT SIDE ACTIONS */}
        <div className="navbar-right-actions">
          {/* HELPLINE DISPLAY */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (navigator.clipboard) {
                navigator.clipboard.writeText('345632567');
              }
              alert('📞 Official Support Helpline: 345632567 (Copied to clipboard!)');
            }}
            className="helpline-nav-badge desktop-only"
            title="Click to copy support helpline number"
          >
            <i className="fa-solid fa-headset"></i> Helpline: 345632567
          </button>

          {isAuthenticated ? (
            <>
              {/* ONLINE STATUS BADGE */}
              <div className="online-indicator-pill desktop-only">
                <span className="online-dot-pulse"></span>
                <span>Online</span>
              </div>

              {/* NOTIFICATION ICON */}
              <NotificationDropdown />

              {/* USER PROFILE & DROPDOWN */}
              <div className="user-menu-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-avatar-button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <UserAvatar
                    src={user?.profileImage}
                    name={user?.name}
                    size="sm"
                  />
                  <span className="user-display-name desktop-only">{user?.name?.split(' ')[0] || 'User'}</span>
                  <i className="fa-solid fa-chevron-down text-xs desktop-only"></i>
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <p className="user-full-name">{user?.name}</p>
                      <p className="user-email-text">{user?.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <i className="fa-solid fa-user-gear"></i> Profile & Preferences
                    </Link>
                    <Link
                      to="/matches"
                      className="dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <i className="fa-solid fa-handshake"></i> My Matches
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item danger-text" onClick={handleLogout}>
                      <i className="fa-solid fa-right-from-bracket"></i> Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* MOBILE HAMBURGER BUTTON */}
              <button
                type="button"
                className="hamburger-btn mobile-only"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation"
              >
                <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
              </button>
            </>
          ) : (
            <div className="auth-nav-buttons">
              <Link to="/login" className="btn-brand outline text-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn-brand primary text-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="mobile-menu-drawer mobile-only">
          <nav className="mobile-nav-links">
            <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <i className="fa-solid fa-house"></i> Home
            </NavLink>
            <NavLink to="/find" onClick={() => setMobileMenuOpen(false)}>
              <i className="fa-solid fa-compass"></i> Find Buddy
            </NavLink>
            <NavLink to="/matches" onClick={() => setMobileMenuOpen(false)}>
              <i className="fa-solid fa-users"></i> Matches
            </NavLink>
            <NavLink to="/connections" onClick={() => setMobileMenuOpen(false)}>
              <i className="fa-solid fa-comments"></i> Chat
            </NavLink>
            <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>
              <i className="fa-solid fa-user"></i> Profile
            </NavLink>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
