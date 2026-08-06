import React, { useEffect, useState } from "react";
import portrait from "./img/pp.jpeg";
import IntroRaw from "./customization/Introduction.json";
import ProjectRaw from "./customization/Project.json";
import ContactRaw from "./customization/Contact.json";
import ThesisRaw from "./customization/Thesis.json";
import Pro from "./pro";

const techHighlights = [
  {
    icon: "psychology",
    title: "Deep Learning & AI",
    description:
      "Developing intelligent systems using TensorFlow and PyTorch, focusing on neural network optimization and predictive modeling.",
    tags: ["TensorFlow", "PyTorch", "Keras"],
    featured: true,
    filled: true,
  },
  {
    icon: "terminal",
    title: "Backend Architecture",
    description:
      "Scalable APIs and microservices built with Django, Flask, and high-concurrency Python patterns.",
  },
  {
    icon: "database",
    title: "Data Systems",
    description:
      "PostgreSQL expertise with complex schema design and query optimization.",
  },
  {
    icon: "cloud_done",
    title: "Cloud Native",
    description:
      "Deployment automation and container orchestration for production loads.",
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

function getHashRoute(hashValue) {
  return hashValue === "#projects-page" ? "projects" : "home";
}

function HomePage() {
  const featuredProject = ProjectRaw.projects[0];
  const thesisLink = ThesisRaw.journal[0]?.link;

  return (
    <main className="page-content">
      <section className="hero-section" id="home">
        <div className="hero-copy">
          <div className="availability-pill">
            <span className="status-dot" />
            <span>Available for Projects</span>
          </div>

          <h1 className="hero-name">Ritwik</h1>

          <h2 className="hero-title">Engineering High-Performance Solutions</h2>

          <p className="hero-description">{IntroRaw.intro}</p>

          <div className="hero-actions">
            <a className="primary-cta" href="#projects-page">
              <span>View Projects</span>
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
              <span className="eyebrow">Software Engineer</span>
              <strong>System Architect</strong>
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

      <section className="featured-work" id="thesis">
        <div className="case-study-card">
          <div className="lock-visual" aria-hidden="true">
            <div className="lock-shackle" />
            <div className="lock-body" />
            <div className="case-study-badge">Explore Case Study</div>
          </div>
        </div>

        <div className="featured-copy">
          <span className="section-kicker">Latest Work</span>
          <h3>{featuredProject.project_name}</h3>
          <p>{featuredProject.project_about}</p>

          <div className="project-metrics">
            <div>
              <strong>99.8%</strong>
              <span>Accuracy Rate</span>
            </div>
            <div>
              <strong>40ms</strong>
              <span>Avg Latency</span>
            </div>
          </div>

          <div className="featured-links">
            <a href="#projects-page">View Project</a>
            {thesisLink ? (
              <a href={thesisLink} target="_blank" rel="noreferrer">
                Read Thesis
              </a>
            ) : null}
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
          ARCHITECT.ENG
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href="#home" className={currentPage === "home" ? "active" : ""}>
            Home
          </a>
          <a href="#projects-page" className={currentPage === "projects" ? "active" : ""}>
            Projects
          </a>
          <a href="#thesis" className={currentPage === "home" && hash === "#thesis" ? "active" : ""}>
            Thesis
          </a>
          <a href="#contact" className={currentPage === "home" && hash === "#contact" ? "active" : ""}>
            Contact
          </a>
        </nav>
        <a className="resume-button" href={`mailto:${ContactRaw.email}`}>
          Resume
        </a>
      </header>

      {currentPage === "projects" ? <Pro /> : <HomePage />}

      <footer className="site-footer" id="contact">
        <div className="footer-copy">© 2024 Digital Architect. Built for high-performance.</div>
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
