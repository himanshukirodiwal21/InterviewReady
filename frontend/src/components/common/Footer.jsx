import { ArrowUpRight } from "lucide-react";
import "./Footer.css";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Interview types", href: "#interview-types" },
      { label: "AI evaluation", href: "#evaluation" },
      { label: "Progress reports", href: "#reports" },
    ],
  },
  {
    heading: "Use cases",
    links: [
      { label: "Students", href: "#students" },
      { label: "Job seekers", href: "#job-seekers" },
      { label: "Career switchers", href: "#career-switchers" },
      { label: "Teams & bootcamps", href: "#teams" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Pricing", href: "#pricing" },
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
    ],
  },
];

const SCORE_WEIGHTS = [
  ["Accuracy", "40%"],
  ["Relevance", "25%"],
  ["Communication", "20%"],
  ["Completeness", "15%"],
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ir-footer">
      <div className="ir-footer__inner">
        <div className="ir-footer__top">
          <div>
            <p className="ir-footer__headline">Walk in ready.</p>
            <p className="ir-footer__subtext">
              Practice with AI-generated questions built from your own resume,
              and get scored the way a real interviewer would.
            </p>
          </div>
          <a href="/register" className="ir-footer__cta">
            Start a free mock interview
            <ArrowUpRight size={15} strokeWidth={2.25} className="ir-footer__cta-icon" />
          </a>
        </div>

        <div className="ir-footer__grid">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="ir-footer__col-heading">{col.heading}</p>
              <ul className="ir-footer__col-links">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="ir-footer__col-link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="ir-footer__legend-col">
            <p className="ir-footer__col-heading">How scoring works</p>
            <ul className="ir-footer__legend-list">
              {SCORE_WEIGHTS.map(([label, weight]) => (
                <li key={label} className="ir-footer__legend-row">
                  <span>{label}</span>
                  <span className="ir-footer__legend-weight">{weight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ir-footer__bottom">
          <p className="ir-footer__copyright">
            © {year} InterviewReady. All rights reserved.
          </p>
          <div className="ir-footer__status">
            <span className="ir-footer__status-dot" aria-hidden="true" />
            <span className="ir-footer__status-text">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}