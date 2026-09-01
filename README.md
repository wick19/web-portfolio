# Ritwik — Portfolio

Full-stack AI/ML Engineer portfolio: production systems narrative, research proof, and a live multimodal Concierge on the free Cloudflare Workers AI tier.

## Live site

**[https://wick19.github.io/web-portfolio/](https://wick19.github.io/web-portfolio/)**

## Resume

[View resume (PDF)](https://drive.google.com/file/d/1Zg3EcBev7zBV2fthIor6eBJa_4lVp91s/view?usp=sharing)

## What this site demonstrates

- **Product surface** — evidence-led Home, Projects, Thesis, Experience, Certification, Contact (JSON-driven content)
- **Interactive Concierge** — grounded Ask AI (text + voice) over portfolio facts, not a toy chatbot
- **Edge AI stack** — Cloudflare Worker + Workers AI (Llama chat, Whisper STT when needed)
- **Responsible free-tier design** — origin allowlist, dual rate limits, audio caps, daily Neurons kill-switch
- **UX polish** — light/dark theme, deep-linked org rail → Experience tabs, in-app browser voice guidance

## Stack

- React 18 + Vite, custom carbon/cyan design system (`src/styles/system.css`)
- Content from `src/customization/*.json`
- **Portfolio Concierge** — hybrid speech + Workers AI inference
- GitHub Pages (`gh-pages`) for the static site; Cloudflare Worker for inference

## Local development

```bash
npm install
npm run dev
```

Create `.env.local` (gitignored):

```bash
VITE_CONCIERGE_URL=https://ritwik-portfolio-concierge.wick19.workers.dev
# optional shared token (must match Worker secret ACCESS_TOKEN)
# VITE_CONCIERGE_TOKEN=your-long-random-string
```

## Product UX notes

| Feature | Behavior |
|---------|----------|
| Theme | Header sun/moon toggle · `light` / `dark` · persisted in `localStorage` |
| Org rail (Home) | Click Sprouts / TekGigz / Onshape / Adidas → matching Experience tab; USM / MS CIS / SRM → Education highlight |
| Concierge controls | Headset = voice session (wave while active) · mic = single turn · stop square · Send = text |
| In-app browsers | LinkedIn/WebView often block mic — UI hints to open in Safari/Chrome; **text chat still works** |

## Portfolio Concierge

Live demo: prompt-grounded LLM over curated portfolio knowledge (experience, projects, thesis, contact), with optional voice.

| Layer | Detail |
|--------|--------|
| UI | `src/components/concierge/Concierge.jsx`, `VoiceWaveIcon.jsx` |
| Speech I/O | `src/lib/voice.js` — **hybrid STT**: Web Speech when available (0 STT Neurons); else `MediaRecorder` → Workers AI **Whisper** (`POST /stt`). TTS = browser `speechSynthesis` |
| Client API | `src/lib/conciergeApi.js` — chat `POST /`, STT `POST /stt` |
| Edge | `worker/` + `@cf/meta/llama-3.1-8b-instruct-fast` + `@cf/openai/whisper-tiny-en` |
| Endpoint | `https://ritwik-portfolio-concierge.wick19.workers.dev` |

**Architecture choice:** prompt-grounded generation (fixed personal knowledge pack in the system prompt), not a vector RAG store — correct fit for a bounded portfolio corpus. Speech stays client-side when the browser supports it so Neurons go to reasoning; Whisper is the universal fallback (Firefox / missing Web Speech).

Deploy / update the Worker:

```bash
cd worker
npm install
npx wrangler login   # once
npx wrangler deploy
```

Then bake `VITE_CONCIERGE_URL` into the site build:

```bash
npm run deploy
```

### Cost & abuse protection

Chat + Whisper consume **Workers AI** free Neurons; browser Web Speech / TTS do not.

| Control | What it does |
|---------|----------------|
| Origin allowlist | Only `wick19.github.io` + local Vite origins |
| Chat rate limits | ~3/min/IP, ~10/hour/IP, ~120/day global |
| STT rate limits | Stricter: ~2/min/IP, ~6/hour/IP, ~40/day global |
| Audio caps | ~8s / ~280KB; reject empty/oversized payloads |
| Chat payload caps | Short messages, short history, low `max_tokens` |
| Kill switch | `CONCIERGE_ENABLED=false` → instant pause |
| Daily free-quota kill | Workers AI **4006** → auto-pause until **00:00 UTC** |
| Optional token | `ACCESS_TOKEN` + `VITE_CONCIERGE_TOKEN` header |
| UI cooldown | ~2.5s between sends |

**Free quota:** **10,000 Neurons / day** (resets **00:00 UTC**). Stay on Workers Free + a $0–$1 billing alert. Kill switch or unpublish if needed.

**Next hardening:** Turnstile (prefer over a static frontend token), KV/DO counters, log-based alerts.

## Deploy site

```bash
npm run deploy
```

Publishes `dist/` to GitHub Pages (`gh-pages`).

## Repo hygiene

Do not commit: `.env.local`, `worker/.dev.vars`, `.vscode/mcp.json`, `.cursor/`, internal plan markdown. Templates (`.env.example`, `worker/.dev.vars.example`) are safe to track.
