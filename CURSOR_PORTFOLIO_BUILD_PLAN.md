# Cursor implementation brief — Ritwik portfolio

**Status:** approved direction; ready for design/build
**Goal:** rebuild the existing portfolio into an exceptional, professional AI-engineer experience. Preserve every existing navigation tab and all factual data. Reorganise presentation freely; do not invent claims, metrics, employers, credentials, or project details.

## 1. Product brief

Create a premium personal portfolio for a **full-stack AI/ML and Python engineer** who ships production AI systems, ML research, cloud-native backend platforms, and user-facing frontend experiences. It should feel like a composed product experience, not a portfolio template or an AI-themed dashboard.

### Experience principles

1. A recruiter understands name, role (**Full-stack AI/ML Engineer** as one lead line — not three titles at once), production-AI focus, and can open the resume within three seconds. The Capability Atlas proves the three pillars; the hero does not laundry-list them.
2. Existing evidence is the protagonist. Design strengthens comprehension; it never replaces proof.
3. The experience is dark, editorial, tactile, and calm. Cyan is an accent and interaction signal, not a flood fill.
4. Every page belongs to one design system but has a task-specific visual mood.
5. Animation is progressive enhancement. Screen mode and `prefers-reduced-motion` are fully usable and equally polished.

### Inspiration: extract principles, never clone

Use Deccan.ai only as one signal for confident editorial type, quiet dark staging, proof near the headline, and restrained motion. Also benchmark award-quality portfolio/product work from Awwwards, FWA, CSS Design Awards, SiteInspire, and respected design-community examples. Do not copy any individual layout, artwork, words, or branding.

**Avoid:** purple AI gradients, terminal rain, fake dashboards/KPIs, animated text that delays comprehension, a bento-card dump, three-dimensional/tilted portrait effects, or a separate visual style for each page.

## 2. Locked information architecture

Keep this primary navigation exactly; the resume remains a persistent direct link:

1. `Home` — `#home`
2. `Projects` — `#projects-page`
3. `Thesis` — `#thesis-page`
4. `Experience` — `#experience-page`
5. `Certification` — `#certification-page`
6. `Contact` — `#contact-page`
7. `Resume` — external Drive URL, opens reliably in a new tab

Keep the existing JSON files as source of truth:

- `src/customization/Introduction.json`
- `src/customization/Project.json`
- `src/customization/Thesis.json`
- `src/customization/Experience.json`
- `src/customization/Education.json`
- `src/customization/Certification.json`
- `src/customization/Contact.json`

Existing factual data must remain intact. Text can be edited only for hierarchy and concise display, never altered in meaning or embellished.

## 3. Visual system

### Design tokens

- **Background:** near-black carbon `#111315` with slightly lighter surfaces `#181C1F`.
- **Primary text:** warm near-white `#F3F1EB`; secondary text muted steel `#9CA5A8`.
- **Accent:** electric cyan around `#40E8DF`; reserve it for actions, active state, system lines, and data emphasis.
- **Borders:** low-contrast cool-grey at 10–16% opacity; use fine rules and dotted/signal dividers sparingly.
- **Type:** an expressive editorial display face for key headlines, paired with a readable modern grotesk/technical sans for navigation, metadata, and body.
- **Spacing:** spacious desktop sections, 12-column max-width grid; dense information only where it improves scanning.
- **Shape:** mostly squared or subtly rounded (4–12px). Avoid soft, generic SaaS pill overload.

### Global components

| Component | Behaviour and design |
|---|---|
| `SiteHeader` | Sticky, compact; wordmark `RITWIK / AI · ML · FULL-STACK`; active route indicator; desktop nav; accessible mobile drawer; persistent Resume button. |
| `PageIntro` | Eyebrow, editorial H1, concise supporting text, page-specific visual motif. |
| `SectionLabel` | Small uppercase `//` label that introduces a section without becoming visual clutter. |
| `EvidenceTag` | Factual provenance label such as `PROPRIETARY · SPROUTS.AI`, `PUBLIC · RESEARCH`, `ACADEMIC / COURSEWORK`. |
| `MetricStrip` | Verified numbers/data only; never add empty statistic boxes. |
| `ProjectRail` | Keyboard-accessible horizontal/selectable project navigation that updates an adjacent detail panel. |
| `StackList` | Simple technical metadata; no cloud of decorative chips. |
| `TextLink` / `PrimaryCTA` | Clear verbs and visible external-link treatment. |
| `Footer` | Resume, GitHub, LinkedIn, Thesis, Email. |

## 4. Page-by-page direction and components

### Home — `#home`

**Job:** establish role clarity and lead visitors into evidence.

1. **Hero / Signal stage**
   - **Role clarity rule:** one lead role line only — prefer **Full-stack AI/ML Engineer**. Do not stack “AI Engineer · ML Engineer · Full-stack Engineer” (or similar) in the hero H1/role. Breadth is proven by the Capability Atlas below, not by a title laundry list.
   - Copy: use the current headline from `Introduction.json`; align `role` display to that single lead line. Supporting sentence may briefly mention production AI, ML, and backend/frontend delivery without repeating titles.
   - Wordmark in `SiteHeader` may carry `AI · ML · FULL-STACK`; that is navigation chrome, not the hero identity line.
   - Include compact availability status, Resume and View Experience calls to action, GitHub/LinkedIn/Email links.
   - Use the existing portrait only as a still, clean editorial crop. If it does not look strong at large size, use a small framed image rather than a hero gimmick.
   - Background: a quiet, low-contrast signal-grid or field; content remains readable without it.
2. **Proof line**
   - Factual organization and education signal: Sprouts.ai, TekGigz, PTC Onshape, Adidas, MS CIS.
   - No implication of endorsements or client logos.
3. **Signature component: Capability Atlas**
   - Three equal, selectable pillars: `AI Systems`, `ML Research`, `Full-stack Platforms`. This is where breadth is shown — not in the hero title.
   - Desktop: three-column system map with an adjacent/underlying detail pane. Mobile: accessible stacked accordion or tabs.
   - AI Systems surfaces Sprouts’ LLM workflows and provider orchestration.
   - ML Research surfaces PathLoss ML and its public paper/repository.
   - Full-stack Platforms surfaces Python/FastAPI, data, cloud-native delivery, React/TypeScript frontend work, and the hotel platform.
   - Each state includes only evidenced copy and links to the appropriate existing page.
4. **Selected proof**
   - Feature Sprouts and PathLoss as asymmetric, editorial case-study previews, not a card grid.
5. **Career snapshot + final CTA**
   - A concise chronological cue and Contact link.

### Projects — `#projects-page`

**Job:** prove the scope of four existing projects.

- Build `ProjectRail` driven directly from `Project.json`.
- Default focus: **Production AI Contact Enrichment Platform**.
- In the detail panel show, in this order: provenance label, project name, problem/challenge, system/outcome, stack, and valid links.
- Projects without public links must show `Proprietary` / `Academic` status instead of a dead button.
- Use subtle diagram-like visual panels based on project type; do not imply confidential architecture details.
- Render these exact projects: Production AI Contact Enrichment Platform, Distributed Hotel Management Platform, UAV Path Loss Prediction using Machine Learning, Boston Home Prices through MLP.

### Thesis — `#thesis-page`

**Job:** communicate credible ML/research depth around PathLoss.

- Page intro: `Research Journal` and the current thesis title/content.
- Use a custom SVG/CSS radio-signal/UAV field, modelled as a research visualization—not a stock sci-fi image.
- `ResearchFacts`: 5G/UAV focus, RF + ML approach, 95–99% prediction band only with existing thesis/paper context.
- `MethodFlow`: environment/features → classical urban model (Okumura-Hata) → ML models (Random Forest, ANN, KNN, Naive Bayes) → comparative prediction/evaluation.
- Provide plainly visible `Read paper` and `View repository` links.
- Do not show charts unless values can be sourced from the existing paper/repository.

### Experience — `#experience-page`

**Job:** make the career history easy to scan and meaningful on close reading.

- Build a chronological `ExperienceTimeline` driven by `Experience.json`; Sprouts should open as the default active story.
- Each experience has a tight metadata row: role, company, dates, location; an expanded detail narrative; compact verified metric strip where the data exists; and stack list.
- Preserve all four roles: Sprouts.ai, TekGigz LLC, PTC Onshape Inc., Adidas.
- Include `Academic Foundation` with both existing education entries as a second, quieter timeline.
- Make the TekGigz improvements (`−20% response time`, `+25% query performance`, `−15% deploy issues`, `+30% release speed`) prominent only as attributed existing evidence.

### Certification — `#certification-page`

**Job:** make seven existing credentials easy to inspect and verify.

- Use a clean `CredentialArchive`, grouped by issuer/capability where factual. Suggested groups: `Programming & Problem Solving`, `Python Foundations`, `Systems & IoT`.
- Every card includes title, detail, issuer, featured state, and `View credential` external link.
- Retain all seven credentials exactly. Do not add dates, expiry status, skill levels, brand logos, or claims not in the source data.

### Contact — `#contact-page`

**Job:** confidently convert recruiter interest into action.

- Large, direct H1 and a short current-role-aligned invitation.
- Email and phone from `Contact.json`; GitHub, LinkedIn, and Resume from `Introduction.json`.
- Include a simple copy-email action only if it has clear success feedback and keyboard accessibility.
- No unnecessary contact form.

## 5. React Bits component assignment

React Bits is an enhancement layer; use a small, deliberate subset already available under `src/components/react-bits/`.

| Page/area | Use | Implementation rule |
|---|---|---|
| Global route transitions | `FadeContent` | Short opacity/translation transition; never block navigation. |
| Home hero | `BlurText` **or** `MaskedHeading` | One headline entrance only; display final text immediately in reduced-motion/screen mode. |
| Hero atmosphere | `DarkVeil` **or** `Silk` | Choose one, run at low contrast, disable on mobile/reduced motion if costly. |
| Capability Atlas | `AnimatedContent` | Animate the active evidence pane, not the labels or core copy. |
| Project evidence cards | `SpotlightCard` | Hover/focus halo must be subtle and keyboard-visible. |
| Verified metrics | `CountUp` | Use only where numerical values are already in JSON and retain the static value when motion is off. |
| Section entry | `FadeContent` | Max one scroll-reveal pattern across pages. |

**Do not use:** `TiltedCard` on portrait or content, `DecryptedText` for important text, `RotatingText` for the role line, `ClickSpark`, multiple background effects, or more than one animated feature in a viewport.

## 6. Stitch workflow

Use Stitch to create the design source, not production code to paste uncritically.

### Prompt 1 — global system + Home

> Design a premium, editorial dark-mode portfolio for a Full-stack AI/ML Engineer who works across Python backend systems and user-facing frontend experiences. Keep the exact navigation: Home, Projects, Thesis, Experience, Certification, Contact, and a persistent Resume CTA. Visual tone: carbon black, warm off-white typography, restrained electric cyan, editorial display typography paired with technical sans. Build a Home page with a role-clear hero (single lead line: “Full-stack AI/ML Engineer” — do not laundry-list three titles in the H1), real portrait area, evidence line, interactive three-pillar Capability Atlas (AI Systems, ML Research, Full-stack Platforms) that proves breadth below the hero, two selected proof stories, and a recruiter-focused CTA. Header wordmark may read RITWIK / AI · ML · FULL-STACK. Avoid purple gradients, generic SaaS cards, terminal aesthetics, fake metrics, and bento-grid dumps. Make both desktop and mobile intentional.

### Prompt 2 — depth pages

> Extend the same portfolio design system into five pages: Projects as an asymmetric project rail with an evidence pane; Thesis as a research editorial with a signal/UAV visualization and method flow; Experience as an accessible chronological timeline; Certification as a minimal credential archive; Contact as a confident conversion page. Preserve visual consistency while allowing each page its own purposeful mood. All content must remain easy to scan, technically credible, and accessible in reduced motion.

### Stitch acceptance checks

- Does the desktop hero expose name, a single lead role line (not three titles), experience CTA, and resume CTA without scrolling?
- Does mobile retain the same order of evidence rather than shrinking desktop panels?
- Are large headings readable rather than merely decorative?
- Is there a coherent component system rather than five unrelated pages?

## 7. Engineering requirements

1. Keep React 18/Vite and existing hash-based routes unless a route migration is separately approved.
2. Retain data-driven rendering from `src/customization/*.json`; do not hard-code resume facts in multiple places.
3. Keep the existing `ProductModeContext`; make it the central control for Screen/product and reduced-motion behavior.
4. `prefers-reduced-motion: reduce` must disable nonessential animation, autoplays, and transitions.
5. Keyboard: navigation, atlas, project rail, timeline controls, mobile drawer, and all links must be operable with visible focus.
6. Avoid canvas/WebGL unless it has a static fallback and has been verified on low-power/mobile devices.
7. Use semantic headings in order; do not use heading tags just for size.
8. Respect external links: `target="_blank" rel="noreferrer"` where appropriate.
9. No dead CTAs. Hide unavailable project-link actions rather than showing them.
10. Test at 320px, 768px, 1024px, and 1440px wide.

## 8. Scorecard and gates

Score is calculated as `weight × criterion score / 10`. Credibility may never fall below **10.0**. The plan improves score by presenting existing evidence more clearly, never by fabricating stronger credentials.

| Criterion | Weight | Baseline | D1 Home | D2 Projects + Thesis | D3 Remaining pages | Final target |
|---|---:|---:|---:|---:|---:|---:|
| Role clarity | 15% | 9.0 | 9.5 | 9.5 | 9.5 | 9.5 |
| Work history & education | 20% | 9.0 | 9.0 | 9.0 | 9.5 | 9.5 |
| Flagship proof | 20% | 8.0 | 8.5 | 9.5 | 9.5 | 9.5 |
| Credibility / honesty | 15% | 10.0 | 10.0 | 10.0 | 10.0 | 10.0 |
| Impact metrics | 10% | 8.0 | 8.0 | 8.5 | 8.5 | 8.5 |
| Scanability | 10% | 9.0 | 9.5 | 9.5 | 9.5 | 9.5 |
| Visual polish | 5% | 8.0 | 9.0 | 9.5 | 10.0 | 10.0 |
| Contact & conversion | 5% | 9.0 | 9.5 | 9.5 | 9.5 | 9.5 |
| **Weighted total** | **100%** | **88.0** | **91.0** | **93.8** | **95.0** | **95.0** |

### Hard gates

- **D0 — audit:** freeze factual source data and verify every existing tab/route.
- **D1 — global system + Home:** weighted score ≥ 91.0; Resume works; hero passes the three-second role test.
- **D2 — Projects + Thesis:** weighted score ≥ 93.5; Sprouts and PathLoss evidence/readability score ≥ 9.5/10.
- **D3 — Experience + Certification + Contact:** weighted score ≥ 95.0; every existing tab has the new system and data is intact.
- **D4 — final QA:** no broken links, no horizontal mobile overflow, no keyboard traps; Screen/reduced-motion mode passes; production build succeeds.

If a proposed design weakens role clarity, scanability, or credibility, revise it before proceeding—do not trade recruiter usefulness for visual spectacle.

## 9. Build order and deliverables

1. Audit current routes, JSON, assets, and external links. Capture an explicit content-preservation checklist.
2. Define tokens and reusable components; add global header/navigation/footer first.
3. Build Home and Capability Atlas. Review desktop and mobile before building deeper pages.
4. Build Projects and Thesis, then re-score.
5. Build Experience, Certification, Contact, then re-score.
6. Add only the approved React Bits effects after semantic/static layouts work.
7. Run build, tests, responsive checks, keyboard checks, reduced-motion checks, and link validation.
8. Deploy only after the final score gate and explicit owner approval.

## 10. Definition of done

- All six current tabs and the persistent Resume CTA remain available.
- Every item from the current JSON data is represented accurately.
- Home, Projects, Thesis, Experience, Certification, and Contact look and behave as one intentional portfolio system.
- Production AI, ML research, and full-stack delivery (Python backend plus frontend) are presented as equal career pillars via the Capability Atlas (and depth pages) — not via a multi-title hero.
- The project and thesis evidence is clear without relying on motion.
- The visual quality is premium on desktop and mobile, without copying a reference site.
- Weighted score is ≥ 95.0, credibility is 10.0, and no final quality gate fails.
