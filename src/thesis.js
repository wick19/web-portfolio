import React from "react";
import ThesisRaw from "./customization/Thesis.json";
import ContactRaw from "./customization/Contact.json";

const researchTags = ["Wireless Comm", "5G Network", "Machine Learning"];

const thesisPanels = [
  {
    icon: "hub",
    title: "Neural Network Integration",
    description:
      "Utilizing deep learning architectures to predict signal attenuation in non-line-of-sight urban canyons, significantly outperforming traditional empirical models.",
    featured: true,
  },
  {
    icon: "flight_takeoff",
    title: "UAV Dynamics",
    description:
      "Modeling Air-to-Air (A2A) links under varying altitudes and atmospheric conditions to ensure link stability during relay operations.",
  },
  {
    icon: "bar_chart",
    title: "Data Processing",
    description:
      "Processing millions of data points from simulation and field tests to train Random Forest regressors for real-time inference.",
  },
  {
    icon: "architecture",
    title: "Okumura-Hata Hybridization",
    description:
      "Enhancing classical propagation models with site-specific ML offsets to achieve +/- 2dB accuracy in dense urban environments.",
    wide: true,
  },
];

function ThesisPage() {
  const thesisLink = ThesisRaw.journal[0]?.link;
  const thesisDescription = ThesisRaw.journal[0]?.description;
  const thesisParagraphs = thesisDescription
    ? thesisDescription
        .split("This approach demonstrates")
        .map((part, index) => (index === 0 ? part.trim() : `This approach demonstrates${part}`.trim()))
        .filter(Boolean)
    : [];

  return (
    <main className="thesis-page">
      <section className="thesis-hero">
        <div className="thesis-hero-copy">
          <span className="thesis-eyebrow">Research Portfolio</span>
          <h1>
            The Future of <span>Wireless</span> Infrastructure.
          </h1>
          <p>
            Investigating the intersection of machine learning and telecommunications to solve
            real-world connectivity challenges in dynamic environments.
          </p>
        </div>

        <div className="thesis-hero-meta" aria-label="Academic thesis label">
          <strong>01.</strong>
          <span>Academic Thesis</span>
        </div>
      </section>

      <section className="thesis-journal">
        <div className="thesis-section-head">
          <h2>Research Journal</h2>
          <span />
        </div>

        <article className="thesis-paper">
          <div className="thesis-paper-visual">
            <div className="thesis-paper-glow" />
            <div className="thesis-paper-rings" />
            <div className="thesis-paper-city" />
            <span className="thesis-drone-dot dot-one" />
            <span className="thesis-drone-dot dot-two" />
            <span className="thesis-drone-dot dot-three" />
            <span className="thesis-drone-dot dot-four" />
            <div className="thesis-paper-uav">
              <span className="material-symbols-outlined" aria-hidden="true">
                flight
              </span>
            </div>
          </div>

          <div className="thesis-paper-copy">
            <div className="thesis-paper-tags">
              {researchTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <h3>Machine Learning-Based Path loss Models For the UAV Air-to-Air (A2A) Prediction</h3>

            <div className="thesis-paper-body">
              {thesisParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="thesis-paper-actions">
              {thesisLink ? (
                <a href={thesisLink} target="_blank" rel="noreferrer">
                  [Paper]
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_right_alt
                  </span>
                </a>
              ) : null}

              <div className="thesis-action-divider" aria-hidden="true" />

              <div className="thesis-publication-meta">
                <span className="material-symbols-outlined" aria-hidden="true">
                  calendar_today
                </span>
                <span>2024 Publication</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="thesis-grid-section">
        <div className="thesis-grid">
          {thesisPanels.map((panel) => (
            <article
              key={panel.title}
              className={[
                "thesis-panel",
                panel.featured ? "thesis-panel-featured" : "",
                panel.wide ? "thesis-panel-wide" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="thesis-panel-copy">
                <span className="material-symbols-outlined" aria-hidden="true">
                  {panel.icon}
                </span>
                <h4>{panel.title}</h4>
                <p>{panel.description}</p>
              </div>
              {panel.wide ? (
                <div className="thesis-panel-illustration" aria-hidden="true">
                  <span className="material-symbols-outlined">architecture</span>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="thesis-cta">
        <div className="thesis-cta-shell">
          <h2>
            Interested in <span>Collaboration?</span>
          </h2>
          <p>
            I am actively seeking research partnerships in the fields of 6G, autonomous aerial
            networks, and edge computing.
          </p>
          <div className="thesis-cta-actions">
            <a className="thesis-primary-action" href={`mailto:${ContactRaw.email}`}>
              Email Me
            </a>
            <a className="thesis-secondary-action" href={thesisLink} target="_blank" rel="noreferrer">
              Download CV
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ThesisPage;
