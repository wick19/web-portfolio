import React, { useState } from "react";
import IntroRaw from "./customization/Introduction.json";
import ContactRaw from "./customization/Contact.json";

const initialFormState = {
  firstName: "",
  lastName: "",
  email: "",
  subject: "New Project Collaboration",
  message: "",
};

const subjects = [
  "New Project Collaboration",
  "System Architecture Consultation",
  "Speaking Engagement",
  "Other",
];

const socialDestinations = [
  {
    icon: "share",
    href: IntroRaw.linkedin,
    label: "LinkedIn",
  },
  {
    icon: "code",
    href: IntroRaw.github,
    label: "GitHub",
  },
  {
    icon: "groups",
    href: `mailto:${ContactRaw.email}`,
    label: "Email",
  },
];

function buildMailtoUrl(formState) {
  const sender = [formState.firstName, formState.lastName].filter(Boolean).join(" ").trim() || "Portfolio inquiry";
  const bodyLines = [
    `Name: ${sender}`,
    `Professional Email: ${formState.email || "Not provided"}`,
    "",
    "Project Brief:",
    formState.message || "No project brief provided.",
  ];

  const params = new URLSearchParams({
    subject: formState.subject,
    body: bodyLines.join("\n"),
  });

  return `mailto:${ContactRaw.email}?${params.toString()}`;
}

function ContactPage() {
  const [formState, setFormState] = useState(initialFormState);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    window.location.href = buildMailtoUrl(formState);
  }

  return (
    <main className="contact-page">
      <header className="contact-hero">
        <h1>
          Let&apos;s Build the <span>Next Generation</span>
        </h1>
        <p>
          Whether it&apos;s a high-performance system architecture or a complex web interface, I&apos;m
          ready to bring technical precision to your vision.
        </p>
      </header>

      <section className="contact-layout">
        <div className="contact-column">
          <article className="contact-info-card">
            <h2>Contact Information</h2>

            <div className="contact-info-list">
              <div className="contact-info-item">
                <div className="contact-icon-box">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    mail
                  </span>
                </div>
                <div>
                  <p>Email</p>
                  <a href={`mailto:${ContactRaw.email}`}>{ContactRaw.email}</a>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-icon-box">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    call
                  </span>
                </div>
                <div>
                  <p>Phone</p>
                  <a href={`tel:${ContactRaw.phone.replace(/\s+/g, "")}`}>{ContactRaw.phone}</a>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-icon-box">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    location_on
                  </span>
                </div>
                <div>
                  <p>Location</p>
                  <span>Remote / Global Availability</span>
                </div>
              </div>
            </div>

            <div className="contact-social-block">
              <p>Connect Elsewhere</p>
              <div className="contact-social-links">
                {socialDestinations.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {item.icon}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </article>

          <aside className="contact-status-card" aria-hidden="true">
            <div className="contact-status-graphic">
              <div className="status-grid" />
              <div className="status-beam beam-one" />
              <div className="status-beam beam-two" />
              <div className="status-beam beam-three" />
            </div>
            <div className="contact-status-copy">
              <span>Current Project Status</span>
              <strong>Available for Q4 collaborations</strong>
            </div>
          </aside>
        </div>

        <section className="contact-form-shell">
          <div className="contact-form-card">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-field-grid">
                <label className="contact-field">
                  <span>First Name</span>
                  <input
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formState.firstName}
                    onChange={handleChange}
                  />
                </label>

                <label className="contact-field">
                  <span>Last Name</span>
                  <input
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formState.lastName}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <label className="contact-field">
                <span>Professional Email</span>
                <input
                  name="email"
                  type="email"
                  placeholder="j.doe@company.com"
                  value={formState.email}
                  onChange={handleChange}
                />
              </label>

              <label className="contact-field">
                <span>Subject</span>
                <select name="subject" value={formState.subject} onChange={handleChange}>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>

              <label className="contact-field">
                <span>Project Brief</span>
                <textarea
                  name="message"
                  rows="6"
                  placeholder="Describe your vision and technical requirements..."
                  value={formState.message}
                  onChange={handleChange}
                />
              </label>

              <button className="contact-submit" type="submit">
                Initialize Contact
                <span className="material-symbols-outlined" aria-hidden="true">
                  send
                </span>
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}

export default ContactPage;
