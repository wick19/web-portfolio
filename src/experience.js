import React from "react";
import ExpRaw from "./customization/Experience.json";
import EduRaw from "./customization/Education.json";
import tekgigzLogo from "./img/tpp.jpeg";
import onshapeLogo from "./img/ons.jpeg";
import adidasLogo from "./img/adi.png";
import sproutsLogo from "./img/sprot_logo.jpeg";
import usmLogo from "./img/usm.png";
import srmLogo from "./img/Srmseal.png";

const logoByCompany = {
  "Sprouts.ai": sproutsLogo,
  "TekGigz LLC": tekgigzLogo,
  "PTC Onshape Inc.": onshapeLogo,
  "Onshape Inc.": onshapeLogo,
  Adidas: adidasLogo,
};

const eduMeta = [
  {
    match: "Southern Mississippi",
    icon: "school",
    filled: true,
    logo: usmLogo,
  },
  {
    match: "SRM",
    icon: "science",
    filled: false,
    logo: srmLogo,
  },
];

function ExperiencePage() {
  const roles = ExpRaw.companies || [];
  const schools = EduRaw.schools || [];

  return (
    <main className="experience-page">
      <header className="project-page-header">
        <h1>
          Career Trajectory<span>.</span>
        </h1>
        <p>
          Production AI systems, FastAPI microservices, and scalable backends—from Sprouts.ai to
          fintech full-stack delivery.
        </p>
      </header>

      <section className="experience-timeline" aria-label="Work experience">
        {roles.map((role, index) => {
          const tags = role.tags || [];
          const logo = logoByCompany[role.name];
          const featured = index === 0;

          return (
            <article
              key={`${role.name}-${role.position_time}`}
              className={featured ? "experience-row experience-row-featured" : "experience-row"}
            >
              <aside className="experience-meta">
                <span className={featured ? "timeline-dot timeline-dot-active" : "timeline-dot"} />
                {logo ? (
                  <img className="experience-logo" src={logo} alt="" aria-hidden="true" />
                ) : (
                  <span className="experience-logo-fallback" aria-hidden="true">
                    {role.name.slice(0, 1)}
                  </span>
                )}
                <h3>{role.name}</h3>
                <p>{role.position_time}</p>
                {role.location ? <span className="experience-location">{role.location}</span> : null}
              </aside>

              <div className="experience-card">
                <h4>{role.position}</h4>
                <p>{role.discription}</p>
                {role.metrics?.length ? (
                  <div className="experience-metrics">
                    {role.metrics.map((metric) => (
                      <div key={metric.label}>
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {tags.length ? (
                  <div className="project-badges">
                    {tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <section className="education-section" aria-label="Education">
        <div className="section-heading">
          <h3>Academic Foundation</h3>
          <span />
        </div>

        <div className="education-strip">
          {schools.map((school) => {
            const meta =
              eduMeta.find((item) => school.name.includes(item.match)) || {
                icon: "school",
                filled: false,
                logo: null,
              };

            return (
              <article key={school.name} className="education-card">
                <span
                  className={
                    meta.filled
                      ? "material-symbols-outlined filled education-icon"
                      : "material-symbols-outlined education-icon"
                  }
                  aria-hidden="true"
                >
                  {meta.icon}
                </span>
                {meta.logo ? (
                  <img className="education-logo" src={meta.logo} alt="" aria-hidden="true" />
                ) : null}
                <h3>{school.name}</h3>
                <p>{school.degree}</p>
                <span className="education-time">
                  {school.location} · {school.time}
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default ExperiencePage;
