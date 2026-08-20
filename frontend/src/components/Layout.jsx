import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content-container">{children}</main>
      <footer className="global-app-footer">
        <div className="footer-content">
          <p>
            Designed & Developed with ❤️ by <span className="creator-highlight">Himanshu</span>
          </p>
          <span className="footer-subtext">BharatBuddy 🇮🇳 • Connecting India through Technology</span>
        </div>
      </footer>
    </div>
  );
}
