import React, { useEffect, useState } from "react";
import portrait from "./img/pp.jpeg";
import IntroRaw from "./customization/Introduction.json";
import ContactRaw from "./customization/Contact.json";
import ThesisRaw from "./customization/Thesis.json";
import Pro from "./pro";
import ThesisPage from "./thesis";
import ContactPage from "./contact";
import ExperiencePage from "./experience";
import CertificationPage from "./certification";

const techHighlights = [
  {
    icon: "psychology",
    title: "AI Systems",
    description:
      "LLM-powered workflows, provider orchestration, RAG patterns, and production AI services with cost-aware caching.",
    tags: ["LLMs", "LangChain", "FastAPI"],
    featured: true,
    filled: true,
  },
  {
    icon: "terminal",
    title: "Backend Architecture",
    description:
      "Production FastAPI/Django/Flask microservices with OAuth2, JWT, SQLAlchemy, and resilient REST APIs.",
  },
  {
    icon: "database",
    title: "Data Systems",
    description:
      "PostgreSQL, Redis, and Azure SQL—schema design, query optimization, and caching for scale.",
  },
  {
    icon: "cloud_done",
    title: "Cloud Native",
    description:
      "Docker, Kubernetes, Helm, and GitHub Actions for reliable CI/CD and production releases.",
  },
];

const socialLinks = [
  {
    label: "GitHub",
    href: IntroRaw.github,
    icon: "code",
  },
  {
    label: "LinkedIn",
    href: IntroRaw.linkedin,
    icon: "work",
  },
  {
    label: "Email",
    href: `mailto:${ContactRaw.email}`,
    icon: "mail",
  },
];

const thesisHighlights = [
  {
    value: "95-99%",
    label: "prediction band",
  },
  {
    value: "5G/UAV",
    label: "wireless focus",
  },
  {
    value: "RF + ML",
    label: "hybrid modeling",
  },
];

const thesisMethods = [
  "Okumura-Hata",
  "Random Forest",
  "ANN",
  "Path Loss",
];

function getHashRoute(hashValue) {
  if (hashValue === "#projects-page") {
    return "projects";
  }

  if (hashValue === "#thesis-page") {
    return "thesis";
  }

  if (hashValue === "#experience-page") {
    return "experience";
  }

  if (hashValue === "#certification-page") {
    return "certification";
  }

  if (hashValue === "#contact-page") {
    return "contact";
  }

  return "home";
}

function HomePage() {
  const thesisLink = ThesisRaw.journal[0]?.link;
  const thesisDescription = ThesisRaw.journal[0]?.description;

  return (
    <main className="page-content">
      <section className="hero-section" id="home">
        <div className="hero-copy">
          <div className="availability-pill">
            <span className="status-dot" />
            <span>Open to full-time roles</span>
          </div>

          <h1 className="hero-name">Ritwik</h1>

          <h2 className="hero-title">{IntroRaw.headline}</h2>

          <p className="hero-description">{IntroRaw.intro}</p>

          <div className="hero-proof-row" aria-label="Proof points">
            <a href="#experience-page">Sprouts.ai</a>
            <span aria-hidden="true">·</span>
            <a href="#thesis-page">PathLoss ML</a>
            <span aria-hidden="true">·</span>
            <a href="#experience-page">MS CIS</a>
          </div>

          <div className="hero-actions">
            <a className="primary-cta" href="#experience-page">
              <span>View Experience</span>
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>

            <div className="icon-actions" aria-label="Social links">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  data-tooltip={link.label}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {link.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <aside className="hero-card">
          <div className="portrait-frame">
            <img src={portrait} alt="Ritwik portrait" />
            <div className="portrait-overlay">
              <span className="eyebrow">{IntroRaw.role}</span>
              <strong>Sprouts.ai</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="section-block" id="expertise">
        <div className="section-heading">
          <h3>Tech Stack &amp; Mastery</h3>
          <span />
        </div>

        <div className="bento-grid">
          {techHighlights.map((item) => (
            <article key={item.title} className={item.featured ? "stack-card stack-card-featured" : "stack-card"}>
              <div className="stack-card-top">
                <span
                  className={item.filled ? "material-symbols-outlined filled" : "material-symbols-outlined"}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {item.index ? <span>{item.index}</span> : null}
              </div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              {item.tags ? (
                <div className="tag-row">
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="featured-work thesis-feature" id="thesis">
        <div className="case-study-card thesis-visual-card">
          <div className="thesis-orbit" aria-hidden="true">
            <div className="thesis-grid-lines" />
            <div className="signal-ring ring-one" />
            <div className="signal-ring ring-two" />
            <div className="signal-ring ring-three" />
            <span className="signal-node node-one" />
            <span className="signal-node node-two" />
            <span className="signal-node node-three" />
            <span className="signal-node node-four" />
            <div className="uav-glyph">
              <span className="material-symbols-outlined" aria-hidden="true">
                settings_input_antenna
              </span>
            </div>
            <div className="thesis-card-label">
              <span>Research Journal</span>
              <strong>Path Loss ML Prediction</strong>
            </div>
          </div>

          <div className="thesis-panel-strip" aria-hidden="true">
            <div>
              <span>Urban Model</span>
              <strong>Okumura-Hata</strong>
            </div>
            <div>
              <span>Inference</span>
              <strong>Random Forest + ANN</strong>
            </div>
          </div>
        </div>

        <div className="featured-copy thesis-copy">
          <span className="section-kicker">Thesis Page</span>
          <h3>Intelligent Wireless Infrastructure.</h3>
          <p>{thesisDescription}</p>

          <div className="project-metrics thesis-metrics">
            {thesisHighlights.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="thesis-methods" aria-label="Research methods">
            {thesisMethods.map((method) => (
              <span key={method}>{method}</span>
            ))}
          </div>

          <div className="featured-links">
            <a href="#thesis-page">Open Thesis Page</a>
            {thesisLink ? (
              <a href={thesisLink} target="_blank" rel="noreferrer">
                Read Thesis Paper
              </a>
            ) : null}
            <a href="https://github.com/wick19/PathLossML_Prediction" target="_blank" rel="noreferrer">
              View Repository
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [hash, setHash] = useState(window.location.hash || "#home");
  const thesisLink = ThesisRaw.journal[0]?.link;
  const currentPage = getHashRoute(hash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || "#home");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (currentPage !== "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const sectionId = (hash || "#home").replace("#", "");
    const target = document.getElementById(sectionId);

    if (target) {
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [currentPage, hash]);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand-mark" href="#home">
          AI ENGINEER
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href="#home" className={currentPage === "home" ? "active" : ""}>
            Home
          </a>
          <a href="#projects-page" className={currentPage === "projects" ? "active" : ""}>
            Projects
          </a>
          <a href="#thesis-page" className={currentPage === "thesis" ? "active" : ""}>
            Thesis
          </a>
          <a href="#experience-page" className={currentPage === "experience" ? "active" : ""}>
            Experience
          </a>
          <a href="#certification-page" className={currentPage === "certification" ? "active" : ""}>
            Certification
          </a>
          <a href="#contact-page" className={currentPage === "contact" ? "active" : ""}>
            Contact
          </a>
        </nav>
        <a
          className="resume-button"
          href="https://drive.google.com/file/d/1ZNzP0xzVURThlOplgm1bSEsur5zCmAjN/view?usp=sharing"
          target="_blank"
          rel="noreferrer"
        >
          Resume
        </a>
      </header>

      {currentPage === "projects" ? (
        <Pro />
      ) : currentPage === "thesis" ? (
        <ThesisPage />
      ) : currentPage === "experience" ? (
        <ExperiencePage />
      ) : currentPage === "certification" ? (
        <CertificationPage />
      ) : currentPage === "contact" ? (
        <ContactPage />
      ) : (
        <HomePage />
      )}

      <footer className="site-footer" id="contact">
        <div className="footer-copy">© 2026 Ritwik · AI Engineer. Built for production.</div>
        <div className="footer-links">
          <a href={IntroRaw.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href={IntroRaw.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {thesisLink ? (
            <a href={thesisLink} target="_blank" rel="noreferrer">
              Thesis
            </a>
          ) : null}
          <a href={`mailto:${ContactRaw.email}`}>Email</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
