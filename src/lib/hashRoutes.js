/** Shared hash helpers for experience deep-links: #experience-page?org=adidas */

export function parseAppHash(hashValue = "") {
  const raw = String(hashValue || "#home").replace(/^#/, "");
  const [pathPart, query = ""] = raw.split("?");
  const path = `#${pathPart || "home"}`;
  const params = new URLSearchParams(query);
  return {
    path,
    org: (params.get("org") || "").toLowerCase().trim(),
  };
}

export function getHashRoute(hashValue) {
  const { path } = parseAppHash(hashValue);
  if (path === "#projects-page") return "projects";
  if (path === "#thesis-page") return "thesis";
  if (path === "#experience-page") return "experience";
  if (path === "#certification-page") return "certification";
  if (path === "#contact-page") return "contact";
  return "home";
}

/** Map logo-rail labels → org query values */
export const PROOF_ORG_LINKS = [
  { label: "Sprouts.ai", href: "#experience-page?org=sprouts", org: "sprouts" },
  { label: "TekGigz", href: "#experience-page?org=tekgigz", org: "tekgigz" },
  {
    label: "PTC Onshape",
    href: "#experience-page?org=onshape",
    org: "onshape",
  },
  { label: "Adidas", href: "#experience-page?org=adidas", org: "adidas" },
  { label: "MS CIS", href: "#experience-page?org=usm", org: "usm" },
  { label: "USM", href: "#experience-page?org=usm", org: "usm" },
  { label: "SRM", href: "#experience-page?org=srm", org: "srm" },
];

export function matchExperienceOrg(companyName, org) {
  if (!org || !companyName) return false;
  const name = companyName.toLowerCase();
  if (org === "sprouts") return name.includes("sprouts");
  if (org === "tekgigz") return name.includes("tekgigz");
  if (org === "onshape") return name.includes("onshape");
  if (org === "adidas") return name.includes("adidas");
  return false;
}

export function isEducationOrg(org) {
  return org === "usm" || org === "srm" || org === "ms-cis";
}
