import React, { useEffect, useState } from "react";
import Pro from "./pro";
import ThesisPage from "./thesis";
import ContactPage from "./contact";
import ExperiencePage from "./experience";
import CertificationPage from "./certification";
import SiteHeader from "./components/site/SiteHeader";
import SiteFooter from "./components/site/SiteFooter";
import HomePage from "./components/home/HomePage";

function getHashRoute(hashValue) {
  if (hashValue === "#projects-page") return "projects";
  if (hashValue === "#thesis-page") return "thesis";
  if (hashValue === "#experience-page") return "experience";
  if (hashValue === "#certification-page") return "certification";
  if (hashValue === "#contact-page") return "contact";
  return "home";
}

function App() {
  const [hash, setHash] = useState(window.location.hash || "#home");
  const currentPage = getHashRoute(hash);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || "#home");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (currentPage !== "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const sectionId = (hash || "#home").replace("#", "");
    const target = document.getElementById(sectionId);

    if (target) {
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [currentPage, hash]);

  return (
    <div className="site-shell">
      <SiteHeader currentPage={currentPage} />

      {currentPage === "projects" ? (
        <Pro />
      ) : currentPage === "thesis" ? (
        <ThesisPage />
      ) : currentPage === "experience" ? (
        <ExperiencePage />
      ) : currentPage === "certification" ? (
        <CertificationPage />
      ) : currentPage === "contact" ? (
        <ContactPage />
      ) : (
        <HomePage />
      )}

      <SiteFooter />
    </div>
  );
}

export default App;
