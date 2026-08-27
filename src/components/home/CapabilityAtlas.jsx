import { useState } from "react";

const PILLARS = [
  {
    id: "ai",
    label: "AI Systems",
    summary:
      "LLM-powered workflows, provider orchestration, and agentic patterns shipped in production.",
    evidence: [
      "Sprouts.ai contact enrichment: FastAPI microservices with intelligent provider orchestration",
      "Hybrid LLM + deterministic services, caching, and async execution for reliability and cost control",
      "Portfolio Concierge: grounded LLM chat on this site via Cloudflare Worker + Workers AI, with rate limits and daily quota kill-switch",
      "LangChain / LangGraph, RAG, prompt engineering, Hugging Face, OpenAI API (Technical Expertise)",
    ],
    links: [
      { href: "#experience-page", label: "View Experience" },
      { href: "#projects-page", label: "View Projects" },
    ],
  },
  {
    id: "ml",
    label: "ML Research",
    summary:
      "Classical and deep models for wireless path-loss prediction — public code and paper.",
    evidence: [
      "UAV Path Loss Prediction: Random Forest, ANN, KNN, Naive Bayes with feature engineering",
      "Stack: Python, Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch",
      "Research paper + repository (PathLossML_Prediction)",
    ],
    links: [
      { href: "#thesis-page", label: "Open Thesis" },
      {
        href: "https://github.com/wick19/PathLossML_Prediction",
        label: "View repository",
        external: true,
      },
    ],
  },
  {
    id: "fullstack",
    label: "Full-stack Platforms",
    summary:
      "Python backends, data systems, cloud-native delivery, and React/TypeScript product surfaces.",
    evidence: [
      "Production FastAPI / Django / Flask with PostgreSQL, Redis, OAuth2/JWT",
      "Sprouts dashboards and insights in React + TypeScript",
      "Docker, Kubernetes, Helm, GitHub Actions; hotel platform on Django + Azure SQL",
    ],
    links: [
      { href: "#experience-page", label: "View Experience" },
      { href: "#projects-page", label: "View Projects" },
    ],
  },
];

export default function CapabilityAtlas() {
  const [active, setActive] = useState(PILLARS[0].id);
  const current = PILLARS.find((p) => p.id === active) || PILLARS[0];

  return (
    <section className="capability-atlas" aria-labelledby="atlas-heading">
      <div className="section-heading-row">
        <p className="section-label">// Capability Atlas</p>
        <h2 id="atlas-heading">What I ship</h2>
        <p className="section-lede">
          Three equal pillars. Select a lane to see evidenced work — not a chip cloud.
        </p>
      </div>

      <div className="atlas-layout">
        <div
          className="atlas-pillars"
          role="tablist"
          aria-label="Capability pillars"
        >
          {PILLARS.map((pillar) => {
            const selected = pillar.id === active;
            return (
              <button
                key={pillar.id}
                type="button"
                role="tab"
                id={`atlas-tab-${pillar.id}`}
                aria-selected={selected}
                aria-controls={`atlas-panel-${pillar.id}`}
                className={selected ? "atlas-pillar is-active" : "atlas-pillar"}
                onClick={() => setActive(pillar.id)}
              >
                <span className="atlas-pillar-index" aria-hidden="true">
                  {String(PILLARS.indexOf(pillar) + 1).padStart(2, "0")}
                </span>
                <span className="atlas-pillar-label">{pillar.label}</span>
                <span className="atlas-pillar-summary">{pillar.summary}</span>
              </button>
            );
          })}
        </div>

        <div
          className="atlas-detail"
          role="tabpanel"
          id={`atlas-panel-${current.id}`}
          aria-labelledby={`atlas-tab-${current.id}`}
        >
          <p className="section-label">// Evidence</p>
          <h3>{current.label}</h3>
          <ul>
            {current.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="atlas-links">
            {current.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
