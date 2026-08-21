import IntroRaw from "../../customization/Introduction.json";
import ContactRaw from "../../customization/Contact.json";
import ThesisRaw from "../../customization/Thesis.json";
import EducationRaw from "../../customization/Education.json";

const EXPLORE = [
  { href: "#home", label: "Home" },
  { href: "#projects-page", label: "Projects" },
  { href: "#thesis-page", label: "Thesis" },
  { href: "#experience-page", label: "Experience" },
  { href: "#certification-page", label: "Certification" },
  { href: "#contact-page", label: "Contact" },
];

function Icon({ children }) {
  return (
    <svg
      className="site-footer-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  resume: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </Icon>
  ),
  github: (
    <Icon>
      <path d="M9 19c-4.5 1.5-4.5-2.5-6-3m12 5v-3.9a3.4 3.4 0 0 0-1-2.6c3.2-.4 6.5-1.6 6.5-7A5.4 5.4 0 0 0 18 5.8 5 5 0 0 0 18 2s-1.3-.4-4.2 1.6a14.5 14.5 0 0 0-7.6 0C3.3 1.6 2 2 2 2a5 5 0 0 0 .1 3.8 5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.3 6.6 6.5 7A3.4 3.4 0 0 0 6 18.1V22" />
    </Icon>
  ),
  linkedin: (
    <Icon>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </Icon>
  ),
  leetcode: (
    <Icon>
      <path d="M9 4 4 9l5 5" />
      <path d="m15 4 5 5-5 5" />
      <path d="M7.5 14.5 12 19l8-8" />
    </Icon>
  ),
  thesis: (
    <Icon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </Icon>
  ),
  email: (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 7 9-7" />
    </Icon>
  ),
};

export default function SiteFooter() {
  const thesisLink = ThesisRaw.journal[0]?.link;
  const schools = EducationRaw.schools ?? [];

  const connect = [
    {
      href: IntroRaw.resume,
      label: "Resume",
      icon: ICONS.resume,
      external: true,
    },
    {
      href: IntroRaw.github,
      label: "GitHub",
      icon: ICONS.github,
      external: true,
    },
    {
      href: IntroRaw.linkedin,
      label: "LinkedIn",
      icon: ICONS.linkedin,
      external: true,
    },
    IntroRaw.leetcode
      ? {
          href: IntroRaw.leetcode,
          label: "LeetCode",
          icon: ICONS.leetcode,
          external: true,
        }
      : null,
    thesisLink
      ? {
          href: thesisLink,
          label: "Thesis paper",
          icon: ICONS.thesis,
          external: true,
        }
      : null,
    {
      href: `mailto:${ContactRaw.email}`,
      label: "Email",
      icon: ICONS.email,
      external: false,
    },
  ].filter(Boolean);

  return (
    <footer className="site-footer-v2">
      <div className="site-footer-grid">
        <div className="site-footer-col">
          <p className="site-footer-heading">Ritwik</p>
          <p className="site-footer-role">
            {IntroRaw.role}
            <span className="site-footer-role-tag"> · MS CIS</span>
          </p>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Explore</p>
          <nav className="site-footer-list" aria-label="Site">
            {EXPLORE.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Education</p>
          <ul className="site-footer-edu">
            {schools.map((school) => (
              <li key={school.name}>
                <a href="#experience-page">{school.name}</a>
                <span>{school.degree}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Connect</p>
          <nav className="site-footer-list site-footer-connect" aria-label="External">
            {connect.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="site-footer-connect-link"
                {...(item.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="site-footer-bar">
        <p className="site-footer-copy">© 2026 Ritwik. Built for production.</p>
      </div>
    </footer>
  );
}
