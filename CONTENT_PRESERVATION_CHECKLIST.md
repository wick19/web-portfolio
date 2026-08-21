# Content preservation checklist (D0)

Frozen against `CURSOR_PORTFOLIO_BUILD_PLAN.md` and `src/customization/*.json`.  
Do not invent claims. Text edits only for hierarchy/display.

## Routes (must remain)

| Tab | Hash | Module |
|---|---|---|
| Home | `#home` | `App.js` HomePage |
| Projects | `#projects-page` | `pro.js` |
| Thesis | `#thesis-page` | `thesis.js` |
| Experience | `#experience-page` | `experience.js` |
| Certification | `#certification-page` | `certification.js` |
| Contact | `#contact-page` | `contact.js` |
| Resume | Drive URL | `Introduction.json` → `resume` |

## Introduction.json

- [x] role (display lead line → Full-stack AI/ML Engineer)
- [x] headline
- [x] intro summary
- [x] github `https://github.com/wick19`
- [x] linkedin
- [x] resume Drive id `1Zi2NyiEVGfKP0HmY24K6QCJUNFrpHy7U`

## Experience.json — 4 roles

- [x] Sprouts.ai — AI Engineer — Sep 2025 – Present
- [x] TekGigz LLC — Python Full Stack Developer — Feb 2024 – Jan 2025
- [x] PTC Onshape Inc. — Software Development Intern — Jun 2019 – Aug 2019
- [x] Adidas — Campus Ambassador — May 2020 – Mar 2021
- [x] TekGigz metrics: −20% API, +25% query, −10% support, −15% deploy, +30% release (as present in source)

## Education.json — 2 schools

- [x] University of Southern Mississippi — MS CIS — Jan 2022 – Dec 2023
- [x] SRM — B.Tech CSE — Jun 2017 – Jun 2021

## Project.json — 4 projects

- [x] Production AI Contact Enrichment Platform — Proprietary · Sprouts.ai
- [x] Distributed Hotel Management Platform — Academic / coursework
- [x] UAV Path Loss Prediction using Machine Learning — Public · Research + repo
- [x] Boston Home Prices through MLP — ML fundamentals · GitHub

## Thesis.json

- [x] description (PathLoss / Okumura-Hata / RF+ML)
- [x] paper link (ResearchPaper95_99.pdf on PathLoss repo)

## Certification.json — 7 credentials

- [x] JavaScript (HackerRank)
- [x] Problem Solving (HackerRank)
- [x] Programming for Everybody (Coursera)
- [x] Python Data Structures (Coursera)
- [x] Intro to IoT and Embedded Systems (Coursera)
- [x] Intro to programming with MATLAB (Coursera)
- [x] Python (HackerRank)

## Contact.json

- [x] email `ritwikshandilya1999@gmail.com`
- [x] phone `+91 7250146461`

## Assets

- [x] Portrait `src/img/pp.jpeg`
- [x] Logos used on Experience (Sprouts, TekGigz, Onshape, Adidas, USM, SRM)

## Audit notes

- `ProductModeContext` exists; wire as Screen/product control in D1+.
- React Bits under `src/components/react-bits/` — apply only after static Home layout (plan §5).
- Hash routing retained (no React Router migration).
