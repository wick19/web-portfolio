import React from "react";
import CertRaw from "./customization/Certification.json";

function CertificationPage() {
  const credentials = CertRaw.credentials || [];

  return (
    <main className="certification-page">
      <header className="project-page-header">
        <h1>
          Credentials<span>.</span>
        </h1>
        <p>
          A verified record of technical proficiency and a commitment to continuous architectural
          evolution.
        </p>
      </header>

      <section className="credential-grid" aria-label="Certifications">
        {credentials.map((credential) => (
          <a
            key={`${credential.issuer}-${credential.title}`}
            className={
              credential.featured ? "credential-card credential-card-featured" : "credential-card"
            }
            href={credential.href}
            target="_blank"
            rel="noreferrer"
          >
            <div className="credential-card-top">
              <span className="credential-issuer">{credential.issuer}</span>
              <span className="material-symbols-outlined" aria-hidden="true">
                open_in_new
              </span>
            </div>

            <div className="credential-card-body">
              <div className="credential-title-row">
                <span className="material-symbols-outlined filled" aria-hidden="true">
                  verified
                </span>
                <h3>{credential.title}</h3>
              </div>
              {credential.detail ? <p>{credential.detail}</p> : null}
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}

export default CertificationPage;
