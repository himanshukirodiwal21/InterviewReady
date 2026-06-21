import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import "./Navbar.css";
import logo from "../../assets/logo.png"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Interview types", href: "#interview-types" },
  { label: "Pricing", href: "#pricing" },
  { label: "For teams", href: "#teams" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="ir-navbar">
      <div className="ir-navbar__inner">
        <a href="/" className="ir-navbar__brand">
          <img src={logo} alt="InterviewReady Logo" width="50" />
          <span className="ir-navbar__brand-name">InterviewReady</span>
        </a>

        <nav className="ir-navbar__links">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="ir-navbar__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ir-navbar__actions">
          <ScoreChip />
          <a href="/login" className="ir-navbar__login">
            <span>Login</span>
          </a>
          <a href="/signup" className="ir-navbar__cta">
            Start a mock interview
            <ArrowRight size={15} strokeWidth={2.25} className="ir-navbar__cta-icon" />
          </a>
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
            <a href="/login" className="ir-navbar__mobile-login">
              <span>Login</span>
            </a>
            <a href="/signup" className="ir-navbar__mobile-cta">
              Start a mock interview
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* Brand mark: checkmark-in-frame — reads as readiness/clearance. */
function BrandMark() {
  return (
    <svg
      className="ir-navbar__brand-mark"
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="28" height="28" rx="8" fill="#2D5A4A" />
      <path
        d="M9 15.5L13.2 19.7L21 11"
        stroke="#FAF9F6"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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