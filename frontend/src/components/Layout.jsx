import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AiAssistantWidget from './AiAssistantWidget';

export default function Layout({ children }) {
  // The redesigned landing page owns its own full-bleed navbar + footer.
  // Everything else keeps the classic shell untouched.
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  return (
    <div className="app-shell">
      {!isLanding && <Navbar />}
      <main className={`main-content-container ${isLanding ? 'landing-main' : ''}`}>
        {children}
      </main>
      {!isLanding && (
        <footer className="global-app-footer">
          <div className="footer-content">
            <p>
              Designed & Developed with ❤️ by <span className="creator-highlight">Himanshu</span>
            </p>
            <span className="footer-subtext">BharatBuddy 🇮🇳 • Connecting India through Technology • Helpline: 345632567</span>
          </div>
        </footer>
      )}
      <AiAssistantWidget />
    </div>
  );
}
