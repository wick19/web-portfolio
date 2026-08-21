import { useState } from "react";
import IntroRaw from "./customization/Introduction.json";
import ContactRaw from "./customization/Contact.json";
import LeetCodeProof from "./components/home/LeetCodeProof";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(ContactRaw.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="depth-page contact-v2">
      <header className="page-intro contact-intro">
        <p className="section-label">// Contact</p>
        <h1>Let&apos;s talk</h1>
        <p className="page-intro-lede">
          Full-stack AI/ML Engineer currently shipping at Sprouts.ai — open to
          full-time roles.
        </p>
      </header>

      <div className="contact-rows">
        <div className="contact-row">
          <span className="muted">Email</span>
          <div className="contact-row-main">
            <a href={`mailto:${ContactRaw.email}`}>{ContactRaw.email}</a>
            <button
              type="button"
              className="btn-secondary contact-copy-btn"
              onClick={copyEmail}
              aria-label={copied ? "Email copied" : "Copy email"}
              title={copied ? "Copied" : "Copy email"}
            >
              {copied ? (
                <svg
                  className="contact-copy-icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="contact-copy-icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <rect
                    x="9"
                    y="9"
                    width="11"
                    height="11"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15V7a2 2 0 0 1 2-2h8"
                  />
                </svg>
              )}
              <span className="sr-only">{copied ? "Copied" : "Copy email"}</span>
            </button>
          </div>
        </div>

        <div className="contact-row">
          <span className="muted">Phone</span>
          <a href={`tel:${ContactRaw.phone.replace(/\s/g, "")}`}>
            {ContactRaw.phone}
          </a>
        </div>
      </div>

      <div className="depth-cta-row">
        <a
          className="btn-primary"
          href={IntroRaw.resume}
          target="_blank"
          rel="noreferrer"
        >
          Open Resume
        </a>
        <a
          className="btn-secondary"
          href={IntroRaw.github}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a
          className="btn-secondary"
          href={IntroRaw.linkedin}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
        {IntroRaw.leetcode ? (
          <a
            className="btn-secondary"
            href={IntroRaw.leetcode}
            target="_blank"
            rel="noreferrer"
          >
            LeetCode
          </a>
        ) : null}
      </div>

      <LeetCodeProof />
    </main>
  );
}
