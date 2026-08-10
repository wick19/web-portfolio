import React from "react";
import ProjectRaw from "./customization/Project.json";
import chartImage from "./img/bhp.png";
import skylineImage from "./img/background.jpg";

const iconByName = {
  "Production AI Contact Enrichment Platform": "hub",
  "AI-Powered Contact Enrichment Platform": "hub",
  "UAV Air-to-Air Path Loss Prediction": "settings_input_antenna",
  "Boston Home Prices through MLP": "home_work",
  "Distributed Hotel Management Platform": "apartment",
};

function Pro() {
  const projects = ProjectRaw.projects || [];
  const featuredProject = projects.find((project) => project.featured) || projects[0];
  const supportingProjects = projects.filter(
    (project) => project.project_name !== featuredProject?.project_name
  );
  const featuredTools = (featuredProject?.project_tool || "")
    .split(",")
    .map((tool) => tool.trim())
    .filter(Boolean);

  if (!featuredProject) {
    return null;
  }

  return (
    <main className="project-page">
      <header className="project-page-header">
        <h1>
          Selected <span>Works.</span>
        </h1>
        <p>
          Production AI at Sprouts.ai, public PathLoss research, then verified ML fundamentals—honest
          labeling for proprietary and academic work.
        </p>
      </header>

      <section className="project-story-grid">
        <article className="project-story-card">
          <div className="project-story-head">
            <div>
              {featuredProject.badge ? (
                <span className="project-status-badge">{featuredProject.badge}</span>
              ) : null}
              <h2>{featuredProject.project_name}</h2>
              <div className="project-badges">
                {featuredTools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
            </div>
            {featuredProject.project_link ? (
              <a
                className="project-icon-link"
                href={featuredProject.project_link}
                target="_blank"
                rel="noreferrer"
                aria-label="Open project repository"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  code
                </span>
              </a>
            ) : (
              <span className="project-icon-link project-icon-link-static" aria-hidden="true">
                <span className="material-symbols-outlined">lock</span>
              </span>
            )}
          </div>

          <div className="project-story-body">
            <p>{featuredProject.project_about}</p>

            <div className="project-insights">
              <div>
                <h4>Core Challenge</h4>
                <p>{featuredProject.challenge}</p>
              </div>
              <div>
                <h4>Outcome</h4>
                <p>{featuredProject.outcome}</p>
              </div>
            </div>
          </div>

          <div className="project-story-footer">
            {featuredProject.project_link ? (
              <a href={featuredProject.project_link} target="_blank" rel="noreferrer">
                View Repository
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </a>
            ) : (
              <a href="#experience-page">
                See Sprouts.ai experience
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </a>
            )}
          </div>
        </article>

        <aside className="project-sidebar-card">
          <div className="project-sidebar-media">
            <img src={skylineImage} alt="" aria-hidden="true" />
            <div className="project-sidebar-overlay" />
            <div className="project-sidebar-copy">
              <span>Proprietary · Production · FastAPI</span>
              <p>&ldquo;LLM workflows with deterministic backends for reliable enrichment.&rdquo;</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="project-bento-grid">
        {supportingProjects.map((project, index) => {
          const tools = (project.project_tool || "")
            .split(",")
            .map((tool) => tool.trim())
            .filter(Boolean);
          const isBoston = project.project_name.includes("Boston");
          const highlighted = index === 0;
          const card = (
            <>
              <div className="support-card-top">
                <span className="material-symbols-outlined" aria-hidden="true">
                  {iconByName[project.project_name] || "terminal"}
                </span>
                {project.project_link ? (
                  <span className="material-symbols-outlined" aria-hidden="true">
                    open_in_new
                  </span>
                ) : null}
              </div>
              <div className="support-card-body">
                {project.badge ? <span className="project-status-badge">{project.badge}</span> : null}
                <h3>{project.project_name}</h3>
                <p>{project.project_about}</p>
                {isBoston ? (
                  <div className="project-chart-card support-chart">
                    <img src={chartImage} alt="Boston home price model chart" />
                    <div className="project-chart-meta">
                      <span>PyTorch MLP</span>
                      <span>Test R² ≈ 0.81</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="support-card-tags">
                {tools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
            </>
          );

          const className = [
            "support-card",
            highlighted ? "support-card-highlighted" : "",
            project.project_link ? "support-card-link" : "",
          ]
            .filter(Boolean)
            .join(" ");

          if (project.project_link) {
            return (
              <a
                key={project.project_name}
                className={className}
                href={project.project_link}
                target="_blank"
                rel="noreferrer"
              >
                {card}
              </a>
            );
          }

          return (
            <article key={project.project_name} className={className}>
              {card}
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default Pro;
