import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight, UserCircle2 } from "lucide-react";
import "./Navbar.css";
import logo from "../../assets/logo.png"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Interview types", href: "#interview-types" },
  { label: "Pricing", href: "#pricing" },
  { label: "For teams", href: "#teams" },
];

// Reads the logged-in user (if any) straight from localStorage.
function readCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(readCurrentUser);

  useEffect(() => {
    // Same-tab login/logout: Login.jsx dispatches this custom event right
    // after it writes/removes "currentUser" in localStorage, since the
    // native `storage` event only fires in *other* tabs, not this one.
    const handleAuthChanged = () => setCurrentUser(readCurrentUser());

    // Cross-tab login/logout: if the user logs in/out in a different tab,
    // the browser's native `storage` event fires here automatically.
    const handleStorage = (e) => {
      if (e.key === "currentUser") setCurrentUser(readCurrentUser());
    };

    window.addEventListener("auth-changed", handleAuthChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <header className="ir-navbar">
      <div className="ir-navbar__inner">
        <Link to="/" className="ir-navbar__brand">
          <img src={logo} alt="InterviewReady Logo" width="50" />
          <span className="ir-navbar__brand-name">InterviewReady</span>
        </Link>

        <nav className="ir-navbar__links">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="ir-navbar__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ir-navbar__actions">
          <ScoreChip />
          {currentUser ? (
            <a
              href="/dashboard"
              className="ir-navbar__profile"
              aria-label="Go to dashboard"
            >
              <UserCircle2 size={28} strokeWidth={1.6} />
            </a>
          ) : (
            <>
              <a href="/login" className="ir-navbar__login">
                <span>Login</span>
              </a>
              <a href="/interview/new" className="ir-navbar__cta">
                Start a mock interview
                <ArrowRight size={15} strokeWidth={2.25} className="ir-navbar__cta-icon" />
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="ir-navbar__toggle"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="ir-navbar__mobile">
          <nav className="ir-navbar__mobile-links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="ir-navbar__mobile-link"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="ir-navbar__mobile-actions">
            {currentUser ? (
              <a
                href="/dashboard"
                className="ir-navbar__mobile-cta"
                onClick={() => setOpen(false)}
              >
                <UserCircle2 size={18} strokeWidth={1.8} />
                Go to Dashboard
              </a>
            ) : (
              <>
                <a href="/login" className="ir-navbar__mobile-login">
                  <span>Login</span>
                </a>
                <a href="/register" className="ir-navbar__mobile-cta">
                  Start a mock interview
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function ScoreChip() {
  return (
    <div className="ir-navbar__chip">
      <span className="ir-navbar__chip-dot" aria-hidden="true" />
      <span className="ir-navbar__chip-text">12,400+ sessions scored</span>
    </div>
  );
}