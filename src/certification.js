import CertRaw from "./customization/Certification.json";

const GROUPS = [
  {
    id: "programming",
    title: "Programming & Problem Solving",
    match: (c) =>
      ["JavaScript", "Problem Solving", "Python"].includes(c.title) &&
      c.issuer === "HackerRank",
  },
  {
    id: "python",
    title: "Python Foundations",
    match: (c) =>
      c.issuer === "Coursera" &&
      (c.title.includes("Python") ||
        c.title.includes("Programming for Everybody")),
  },
  {
    id: "systems",
    title: "Systems & IoT",
    match: (c) => c.title.includes("IoT") || c.title.includes("MATLAB"),
  },
];

function issuerMark(issuer) {
  if (!issuer) return "?";
  const parts = issuer.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function credentialKey(c) {
  return `${c.issuer}-${c.title}`;
}

export default function CertificationPage() {
  const credentials = CertRaw.credentials || [];
  const used = new Set();

  const grouped = GROUPS.map((group) => {
    const items = credentials.filter((c) => {
      const ok = group.match(c) && !used.has(credentialKey(c));
      if (ok) used.add(credentialKey(c));
      return ok;
    });
    return { ...group, items };
  }).filter((g) => g.items.length);

  const leftover = credentials.filter((c) => !used.has(credentialKey(c)));

  const sections = [
    ...grouped,
    ...(leftover.length
      ? [{ id: "other", title: "Additional", items: leftover }]
      : []),
  ];

  return (
    <main className="depth-page certs-v2">
      <header className="page-intro">
        <p className="section-label">// Credentials</p>
        <h1>Certification archive</h1>
        <p className="page-intro-lede">
          Verifiable credentials — click a card to open the source.
        </p>
      </header>

      <div className="cert-archive">
        {sections.map((group) => (
          <section key={group.id} className="cert-group">
            <h2>{group.title}</h2>
            <ul className="cert-grid">
              {group.items.map((credential) => (
                <li key={credentialKey(credential)}>
                  <a
                    className="cert-card"
                    href={credential.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="cert-mark" aria-hidden="true">
                      {issuerMark(credential.issuer)}
                    </span>
                    <span className="cert-copy">
                      <strong>{credential.title}</strong>
                      {credential.detail ? (
                        <span className="cert-detail">{credential.detail}</span>
                      ) : null}
                      <span className="cert-meta">{credential.issuer}</span>
                    </span>
                    <span className="cert-action">View</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
