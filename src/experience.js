import { useMemo, useState } from "react";
import ExpRaw from "./customization/Experience.json";
import EduRaw from "./customization/Education.json";
import sproutsLogo from "./img/sprot_logo.jpeg";
import tekgigzLogo from "./img/tpp.jpeg";
import onshapeLogo from "./img/ons.jpeg";
import adidasLogo from "./img/adi.png";
import usmLogo from "./img/usm.png";
import srmLogo from "./img/Srmseal.png";

const LOGO_BY_PATH = {
  "./img/sprot_logo.jpeg": sproutsLogo,
  "./img/tpp.jpeg": tekgigzLogo,
  "./img/ons.jpeg": onshapeLogo,
  "./img/adi.png": adidasLogo,
  "./img/usm.png": usmLogo,
  "./img/Srmseal.png": srmLogo,
};

function resolveLogo(path) {
  return LOGO_BY_PATH[path] || null;
}

export default function ExperiencePage() {
  const roles = ExpRaw.companies || [];
  const schools = EduRaw.schools || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = useMemo(() => roles[activeIndex] || roles[0], [roles, activeIndex]);
  const activeLogo = resolveLogo(active?.logo);

  if (!active) return null;

  return (
    <main className="depth-page experience-v2">
      <header className="page-intro">
        <p className="section-label">// Experience</p>
        <h1>Career history</h1>
        <p className="page-intro-lede">
          Production AI systems, full-stack delivery, and verified impact — scan
          the timeline, then read the active story.
        </p>
      </header>

      <div className="experience-layout">
        <div className="experience-rail" role="tablist" aria-label="Roles">
          {roles.map((role, index) => {
            const selected = index === activeIndex;
            const logo = resolveLogo(role.logo);
            return (
              <button
                key={`${role.name}-${role.position_time}`}
                type="button"
                role="tab"
                aria-selected={selected}
                className={
                  selected
                    ? "experience-rail-item is-active"
                    : "experience-rail-item"
                }
                onClick={() => setActiveIndex(index)}
              >
                <span className="experience-rail-head">
                  {logo ? (
                    <img
                      className="experience-logo"
                      src={logo}
                      alt=""
                      width={36}
                      height={36}
                    />
                  ) : null}
                  <span className="experience-rail-copy">
                    <strong>{role.name}</strong>
                    <span>{role.position}</span>
                    <span className="muted">{role.position_time}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <article className="experience-story" role="tabpanel">
          <div className="experience-meta-row">
            <div className="experience-meta-main">
              {activeLogo ? (
                <img
                  className="experience-logo experience-logo-lg"
                  src={activeLogo}
                  alt=""
                  width={48}
                  height={48}
                />
              ) : null}
              <div>
                <h2>{active.position}</h2>
                <p>
                  {active.name}
                  {active.location ? ` · ${active.location}` : ""}
                </p>
              </div>
            </div>
            <span className="muted">{active.position_time}</span>
          </div>

          <p className="experience-narrative">{active.discription}</p>

          {active.metrics?.length ? (
            <div className="metric-strip" aria-label="Verified metrics">
              {active.metrics.map((m) => (
                <div key={`${m.value}-${m.label}`}>
                  <strong>{m.value}</strong>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          {active.tags?.length ? (
            <ul className="stack-list">
              {active.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>

      <section className="academic-foundation" aria-labelledby="edu-heading">
        <p className="section-label">// Academic foundation</p>
        <h2 id="edu-heading">Education</h2>
        <ul>
          {schools.map((school) => {
            const logo = resolveLogo(school.logo);
            return (
              <li key={school.name} className="academic-row">
                {logo ? (
                  <img
                    className="experience-logo experience-logo-lg"
                    src={logo}
                    alt=""
                    width={48}
                    height={48}
                  />
                ) : null}
                <div className="academic-copy">
                  <strong>{school.name}</strong>
                  <span>
                    {school.degree} · {school.time}
                  </span>
                  {school.location ? (
                    <span className="muted">{school.location}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
