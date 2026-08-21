import { useEffect, useId, useState } from "react";
import IntroRaw from "../../customization/Introduction.json";

const NAV = [
  { id: "home", href: "#home", label: "Home" },
  { id: "projects", href: "#projects-page", label: "Projects" },
  { id: "thesis", href: "#thesis-page", label: "Thesis" },
  { id: "experience", href: "#experience-page", label: "Experience" },
  { id: "certification", href: "#certification-page", label: "Certification" },
  { id: "contact", href: "#contact-page", label: "Contact" },
];

export default function SiteHeader({ currentPage }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

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
          <span className={open ? "menu-icon is-open" : "menu-icon"} aria-hidden="true" />
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
