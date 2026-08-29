import { useMemo, useState } from "react";
import ProjectRaw from "./customization/Project.json";
import EvidenceTag from "./components/site/EvidenceTag";

function stackList(tools) {
  return (tools || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function Pro() {
  const projects = ProjectRaw.projects || [];
  const [activeName, setActiveName] = useState(
    projects.find((p) => p.featured)?.project_name || projects[0]?.project_name
  );

  const active = useMemo(
    () => projects.find((p) => p.project_name === activeName) || projects[0],
    [projects, activeName]
  );

  if (!active) return null;

  const tools = stackList(active.project_tool);
  const hasLink = Boolean(active.project_link);

  return (
    <main className="depth-page projects-v2">
      <header className="page-intro">
        <p className="section-label">// Projects</p>
        <h1>Selected systems</h1>
        <p className="page-intro-lede">
          Production AI, computer vision, mobile, and research systems — with
          honest provenance for proprietary and public work.
        </p>
      </header>

      <div className="project-rail-layout">
        <div
          className="project-rail"
          role="tablist"
          aria-label="Projects"
        >
          {projects.map((project) => {
            const selected = project.project_name === active.project_name;
            return (
              <button
                key={project.project_name}
                type="button"
                role="tab"
                aria-selected={selected}
                className={selected ? "project-rail-item is-active" : "project-rail-item"}
                onClick={() => setActiveName(project.project_name)}
              >
                {project.badge ? (
                  <span className="project-rail-badge">{project.badge}</span>
                ) : null}
                <span className="project-rail-title">{project.project_name}</span>
              </button>
            );
          })}
        </div>

        <article
          className="project-evidence"
          role="tabpanel"
          aria-label={active.project_name}
        >
          {active.badge ? <EvidenceTag>{active.badge}</EvidenceTag> : null}
          <h2>{active.project_name}</h2>

          <div className="evidence-block">
            <h3>Challenge</h3>
            <p>{active.challenge || active.project_about}</p>
          </div>

          <div className="evidence-block">
            <h3>Outcome</h3>
            <p>{active.outcome || active.project_about}</p>
          </div>

          {tools.length ? (
            <div className="evidence-block">
              <h3>Stack</h3>
              <ul className="stack-list">
                {tools.map((tool, i) => (
                  <li key={`${tool}-${i}`}>{tool}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="project-evidence-actions">
            {hasLink ? (
              <a
                className="btn-primary"
                href={active.project_link}
                target="_blank"
                rel="noreferrer"
              >
                View repository
              </a>
            ) : (
              <span className="status-pill">{active.badge || "Proprietary"}</span>
            )}
            <a className="btn-secondary" href="#experience-page">
              Related experience
            </a>
          </div>
        </article>
      </div>
    </main>
  );
}
