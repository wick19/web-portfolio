import ThesisRaw from "./customization/Thesis.json";
import EvidenceTag from "./components/site/EvidenceTag";
import thesisViz from "./img/thesis-uav-pathloss.jpg";

const FACTS = [
  { value: "5G / UAV", label: "wireless focus" },
  { value: "RF + ML", label: "hybrid modeling" },
  { value: "95–99%", label: "prediction band (paper)" },
];

const DEFAULT_METHODS = [
  "Environment / features",
  "Okumura–Hata · Log-distance",
  "RF · ANN · KNN · NB · LR",
  "Comparative evaluation",
];

const DEFAULT_TOOLS = [
  "scikit-learn",
  "pandas",
  "NumPy",
  "Matplotlib",
  "Seaborn",
  "MLPRegressor",
];

export default function ThesisPage() {
  const thesis = ThesisRaw.journal[0] || {};
  const paper = thesis.link;
  const repo = thesis.repo || "https://github.com/wick19/PathLossML_Prediction";
  const notebook = thesis.notebook;
  const methods = thesis.methods?.length ? thesis.methods : DEFAULT_METHODS;
  const tools = thesis.tools?.length ? thesis.tools : DEFAULT_TOOLS;

  return (
    <main className="depth-page thesis-v2">
      <header className="thesis-hero">
        <div className="thesis-hero-copy">
          <p className="section-label">// Research Journal</p>
          <h1>Path loss prediction for wireless &amp; UAV links</h1>
          <p className="page-intro-lede">{thesis.description}</p>
        </div>
        <figure className="thesis-viz">
          <img
            src={thesisViz}
            alt="UAV air-to-air path loss diagram: A2A link, Okumura–Hata, and RF · ANN · ML hybrid modeling"
            width={1264}
            height={848}
            decoding="async"
          />
        </figure>
      </header>

      <section className="metric-strip" aria-label="Research facts">
        {FACTS.map((fact) => (
          <div key={fact.label}>
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </div>
        ))}
      </section>

      <section className="method-flow" aria-labelledby="method-heading">
        <p className="section-label">// Method flow</p>
        <h2 id="method-heading">From features to evaluation</h2>
        <ol>
          {methods.map((step, i) => (
            <li key={step}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="thesis-stack" aria-labelledby="stack-heading">
        <p className="section-label">// ML stack</p>
        <h2 id="stack-heading">Tools from the research repo</h2>
        <p className="thesis-stack-lede">
          Stack used in{" "}
          <a href={repo} target="_blank" rel="noreferrer">
            PathLossML_Prediction
          </a>{" "}
          for data prep, model training, and evaluation.
        </p>
        <ul className="stack-list thesis-tool-list">
          {tools.map((tool) => (
            <li key={tool}>
              <EvidenceTag>{tool}</EvidenceTag>
            </li>
          ))}
        </ul>
      </section>

      <div className="depth-cta-row">
        <a className="btn-primary" href={repo} target="_blank" rel="noreferrer">
          View GitHub repo
        </a>
        {notebook ? (
          <a className="btn-secondary" href={notebook} target="_blank" rel="noreferrer">
            Open notebook
          </a>
        ) : null}
        {paper ? (
          <a className="btn-secondary" href={paper} target="_blank" rel="noreferrer">
            Read paper
          </a>
        ) : null}
      </div>
    </main>
  );
}
