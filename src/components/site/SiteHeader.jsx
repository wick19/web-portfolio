import { useEffect, useId, useState } from "react";
import IntroRaw from "../../customization/Introduction.json";
import { useProductMode } from "../../ProductModeContext";

const NAV = [
  { id: "home", href: "#home", label: "Home" },
  { id: "projects", href: "#projects-page", label: "Projects" },
  { id: "thesis", href: "#thesis-page", label: "Thesis" },
  { id: "experience", href: "#experience-page", label: "Experience" },
  { id: "certification", href: "#certification-page", label: "Certification" },
  { id: "contact", href: "#contact-page", label: "Contact" },
];

function IconSun() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
    </svg>
  );
}

export default function SiteHeader({ currentPage }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { theme, toggleTheme } = useProductMode();

  useEffect(() => {
    setOpen(false);
  }, [currentPage]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <a className="site-wordmark" href="#home">
        <span className="site-wordmark-name">RITWIK</span>
        <span className="site-wordmark-meta" aria-hidden="true">
          /
        </span>
        <span className="site-wordmark-meta">AI · ML · FULL-STACK</span>
      </a>

      <nav className="site-nav" aria-label="Primary">
        {NAV.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={currentPage === item.id ? "is-active" : undefined}
            aria-current={currentPage === item.id ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="site-header-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          {theme === "light" ? <IconMoon /> : <IconSun />}
        </button>
        <a
          className="btn-resume"
          href={IntroRaw.resume}
          target="_blank"
          rel="noreferrer"
        >
          Resume
        </a>
        <button
          type="button"
          className="site-menu-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span
            className={open ? "menu-icon is-open" : "menu-icon"}
            aria-hidden="true"
          />
        </button>
      </div>

      {open ? (
        <div className="site-mobile-drawer" id={panelId}>
          <nav aria-label="Mobile">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={currentPage === item.id ? "is-active" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              className="theme-toggle theme-toggle-drawer"
              onClick={toggleTheme}
            >
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>
            <a
              className="btn-resume"
              href={IntroRaw.resume}
              target="_blank"
              rel="noreferrer"
            >
              Resume
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
