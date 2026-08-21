import portrait from "../../img/pp.jpeg";
import IntroRaw from "../../customization/Introduction.json";
import ContactRaw from "../../customization/Contact.json";
import ThesisRaw from "../../customization/Thesis.json";
import ProjectRaw from "../../customization/Project.json";
import CapabilityAtlas from "./CapabilityAtlas";
import EvidenceTag from "../site/EvidenceTag";
import LogoLoop from "../react-bits/LogoLoop";
import { useProductMode } from "../../ProductModeContext";

const socialLinks = [
  { label: "GitHub", href: IntroRaw.github },
  { label: "LinkedIn", href: IntroRaw.linkedin },
  { label: "Email", href: `mailto:${ContactRaw.email}` },
];

const proofOrgs = [
  { label: "Sprouts.ai", href: "#experience-page" },
  { label: "TekGigz", href: "#experience-page" },
  { label: "PTC Onshape", href: "#experience-page" },
  { label: "Adidas", href: "#experience-page" },
  { label: "MS CIS", href: "#experience-page" },
  { label: "USM", href: "#experience-page" },
  { label: "SRM", href: "#experience-page" },
];

const proofLoopItems = proofOrgs.map((org) => ({
  node: (
    <a className="proof-loop-link" href={org.href}>
      {org.label}
    </a>
  ),
  ariaLabel: org.label,
  title: org.label,
}));

function ProofOrgRail({ useLoop, direction = "left", labelledBy }) {
  return (
    <section
      className="proof-line proof-rail"
      aria-label={labelledBy || "Organizations and education"}
    >
      {useLoop ? (
        <LogoLoop
          logos={proofLoopItems}
          speed={38}
          direction={direction}
          gap={48}
          logoHeight={22}
          fadeOut
          fadeOutColor="#111315"
          pauseOnHover
          ariaLabel={labelledBy || "Organizations and education"}
          className="proof-logo-loop"
        />
      ) : (
        <ul className="proof-line-static">
          {proofOrgs.map((org, i) => (
            <li key={`${org.label}-${direction}`}>
              {i > 0 ? <span aria-hidden="true">·</span> : null}
              <a href={org.href}>{org.label}</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function findProject(name) {
  return ProjectRaw.projects.find((p) => p.project_name === name);
}

export default function HomePage() {
  const { cinema, reducedMotion } = useProductMode();
  const sprouts = findProject("Production AI Contact Enrichment Platform");
  const pathloss = findProject(
    "UAV Path Loss Prediction using Machine Learning"
  );
  const thesisLink = ThesisRaw.journal[0]?.link;
  const useLoop = cinema && !reducedMotion;

  return (
    <main className="page-home">
      <section className="hero-signal" id="home" aria-labelledby="hero-name">
        <div className="hero-signal-copy">
          <p className="availability-chip">
            <span className="availability-dot" aria-hidden="true" />
            Open to full-time roles
          </p>

          <h1 id="hero-name" className="hero-signal-name">
            Ritwik
          </h1>

          <p className="hero-signal-role">{IntroRaw.role}</p>
          <p className="hero-signal-headline">{IntroRaw.headline}</p>

          <div className="hero-signal-actions">
            <a className="btn-primary" href="#experience-page">
              View Experience
            </a>
            <a
              className="btn-secondary"
              href={IntroRaw.resume}
              target="_blank"
              rel="noreferrer"
            >
              Open Resume
            </a>
          </div>

          <div className="hero-signal-social" aria-label="Social links">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.href.startsWith("mailto:")
                  ? {}
                  : { target: "_blank", rel: "noreferrer" })}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <aside className="hero-signal-portrait">
          <figure className="portrait-editorial">
            <img src={portrait} alt="Portrait of Ritwik" />
            <figcaption>
              <span>Currently</span>
              <strong>AI Engineer · Sprouts.ai</strong>
            </figcaption>
          </figure>
        </aside>
      </section>

      <ProofOrgRail
        useLoop={useLoop}
        direction="left"
        labelledBy="Organizations and education"
      />

      <CapabilityAtlas />

      <ProofOrgRail
        useLoop={useLoop}
        direction="right"
        labelledBy="Organizations and education continued"
      />
      <section className="selected-proof" aria-labelledby="selected-proof-heading">
        <div className="section-heading-row">
          <p className="section-label">// Selected proof</p>
          <h2 id="selected-proof-heading">Evidence that leads</h2>
        </div>

        <div className="selected-proof-grid">
          {sprouts ? (
            <article className="proof-case proof-case-featured">
              <EvidenceTag>{sprouts.badge}</EvidenceTag>
              <h3>{sprouts.project_name}</h3>
              <p>{sprouts.challenge}</p>
              <p className="proof-outcome">{sprouts.outcome}</p>
              <a href="#projects-page">Open Projects</a>
            </article>
          ) : null}

          {pathloss ? (
            <article className="proof-case">
              <EvidenceTag>{pathloss.badge}</EvidenceTag>
              <h3>{pathloss.project_name}</h3>
              <p>{pathloss.project_about}</p>
              <div className="proof-case-links">
                <a href="#thesis-page">Open Thesis</a>
                {thesisLink ? (
                  <a href={thesisLink} target="_blank" rel="noreferrer">
                    Read paper
                  </a>
                ) : null}
                {pathloss.project_link ? (
                  <a
                    href={pathloss.project_link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View repository
                  </a>
                ) : null}
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="career-snapshot" aria-labelledby="career-heading">
        <div className="section-heading-row">
          <p className="section-label">// Career snapshot</p>
          <h2 id="career-heading">Where I&apos;ve shipped</h2>
        </div>
        <ol className="career-snap-list">
          <li>
            <strong>Sprouts.ai</strong>
            <span>AI Engineer · Sep 2025 – Present</span>
          </li>
          <li>
            <strong>TekGigz LLC</strong>
            <span>Python Full Stack · Feb 2024 – Jan 2025</span>
          </li>
          <li>
            <strong>PTC Onshape</strong>
            <span>Software Development Intern · 2019</span>
          </li>
        </ol>
        <div className="career-snap-cta">
          <a className="btn-primary" href="#experience-page">
            Full Experience
          </a>
          <a className="btn-secondary" href="#contact-page">
            Contact
          </a>
        </div>
      </section>
    </main>
  );
}
