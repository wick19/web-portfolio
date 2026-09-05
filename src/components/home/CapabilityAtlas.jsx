import { useState } from "react";

const PILLARS = [
  {
    id: "ai",
    label: "AI Systems",
    summary:
      "Generative AI, retrieval, and agentic workflows shipped as production products.",
    evidence: [
      "Sprouts.ai contact enrichment: LLM reasoning, semantic retrieval, and entity resolution over Elasticsearch",
      "Production inference with Azure OpenAI, Hugging Face Transformers, TensorFlow, and PyTorch (chat, embeddings, ranking, semantic search)",
      "Two FastAPI microservices with JWT, OAuth2, multi-tenant RBAC, provider routing, caching, and rate limiting",
      "LangChain / LangGraph, RAG, Agentic AI, prompt engineering (Technical Expertise)",
      "Portfolio Concierge: grounded LLM + privacy-first Siri-style voice (Hey Wick after Ask AI opens, mic off between turns) with multilingual browser speech, rate limits, and a daily quota kill-switch",
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
      "UAV Path Loss Prediction: Random Forest, ANN, KNN, Naive Bayes with feature engineering vs Okumura–Hata / log-distance",
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
      "Python backends, data systems, cloud-native delivery, and React/Next.js product surfaces.",
    evidence: [
      "Production FastAPI / Django / Flask with PostgreSQL, Redis, Elasticsearch, OAuth2/JWT",
      "Sprouts product surfaces in React, Next.js, TypeScript, Vite, and Tailwind — dashboards, graph discovery, network viz, hierarchy views",
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
