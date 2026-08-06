import React from "react";
import ProjectRaw from "./customization/Project.json";
import chartImage from "./img/bhp.png";
import skylineImage from "./img/background.jpg";

const supportingProjects = [
  {
    icon: "terminal",
    title: "Neural Style Engine",
    description:
      "An optimized VGG-19 implementation for real-time video style transfer using CUDA acceleration and TensorRT optimization.",
    tools: ["C++", "CUDA", "OpenCV"],
  },
  {
    icon: "database",
    title: "Query Architect",
    description:
      "Distributed SQL optimization engine designed for multi-petabyte datasets, focusing on cold-storage retrieval latency.",
    tools: ["Rust", "Go", "Kubernetes"],
    highlighted: true,
  },
];

function Pro() {
  const featuredProject = ProjectRaw.projects[0];
  const featuredTools = featuredProject.project_tool.split(",").map((tool) => tool.trim());

  return (
    <main className="project-page">
      <header className="project-page-header">
        <h1>
          Selected <span>Works.</span>
        </h1>
        <p>
          A collection of technical case studies focused on machine learning architecture, full-stack
          engineering, and performance optimization.
        </p>
      </header>

      <section className="project-story-grid">
        <article className="project-story-card">
          <div className="project-story-head">
            <div>
              <h2>{featuredProject.project_name}</h2>
              <div className="project-badges">
                {featuredTools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
            </div>
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
          </div>

          <div className="project-story-body">
            <p>
              This project implements a Multi-Layer Perceptron (MLP) to solve a complex regression task:
              predicting median house values in Boston. The model leverages 13 distinct input variables
              including environmental factors, structural attributes, and socio-economic indicators.
            </p>

            <div className="project-insights">
              <div>
                <h4>Core Challenge</h4>
                <p>
                  Mapping non-linear relationships between fragmented urban datasets and real-estate
                  valuation metrics using deep learning architectures.
                </p>
              </div>
              <div>
                <h4>Outcome</h4>
                <p>
                  Achieved a significantly lower Mean Squared Error compared to baseline linear models
                  through hyperparameter tuning and layer normalization.
                </p>
              </div>
            </div>

            <div className="project-chart-card">
              <img src={chartImage} alt="Model performance chart for Boston home price predictions" />
              <div className="project-chart-meta">
                <span>Model Performance: Loss Curve</span>
                <span>Epoch 500 / 0.0021 MSE</span>
              </div>
            </div>
          </div>

          <div className="project-story-footer">
            <a href={featuredProject.project_link} target="_blank" rel="noreferrer">
              Read Full Case Study
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
          </div>
        </article>

        <aside className="project-sidebar-card">
          <div className="project-sidebar-media">
            <img src={skylineImage} alt="Atmospheric city skyline used as project cover art" />
            <div className="project-sidebar-overlay" />
            <div className="project-sidebar-copy">
              <span>Lat: 42.3601 N / Lon: 71.0589 W</span>
              <p>"Predicting urban evolution through recursive data processing."</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="project-bento-grid">
        {supportingProjects.map((project) => (
          <article
            key={project.title}
            className={project.highlighted ? "support-card support-card-highlighted" : "support-card"}
          >
            <div className="support-card-top">
              <span className="material-symbols-outlined" aria-hidden="true">
                {project.icon}
              </span>
              <span className="material-symbols-outlined" aria-hidden="true">
                open_in_new
              </span>
            </div>
            <div className="support-card-body">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>
            <div className="support-card-tags">
              {project.tools.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Pro;
