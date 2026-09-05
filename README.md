# Ritwik — Portfolio

Full-stack AI/ML Engineer portfolio: production systems narrative, research proof, and a live multimodal Concierge on the Cloudflare Workers AI tier.

## Live site

**[https://wick19.github.io/web-portfolio/](https://wick19.github.io/web-portfolio/)**

## Resume

[View resume (PDF)](https://drive.google.com/file/d/1Pu-Y8YigNo-lJYwXHzi2lZndeNZ3FXQK/view?usp=sharing)

## What this site demonstrates

- **Product surface** — evidence-led Home, Projects, Thesis, Experience, Certification, Contact (JSON-driven content)
- **Interactive Concierge** — grounded Ask AI (text + voice) over portfolio facts, privacy-first Siri-style turns, and multilingual speech
- **Edge AI stack** — Cloudflare Worker + Workers AI (Llama chat, Whisper STT when needed)
- **Scheduled live data plane** — Worker Cron Triggers warm a shared Cache API snapshot so public stats stay fresh without depending on a browser visit
- **Responsible free-tier design** — origin allowlist, dual rate limits, audio caps, daily Neurons kill-switch
- **UX polish** — light/dark theme, deep-linked org rail → Experience tabs, formatted replies, in-app browser voice guidance

## Stack

- React 18 + Vite, custom carbon/cyan design system (`src/styles/system.css`)
- Content from `src/customization/*.json`
- **Portfolio Concierge** — hybrid speech + Workers AI inference
- Cloudflare Worker Cron Triggers + Cache API for scheduled live stats refresh
- GitHub Pages (`gh-pages`) for the static site; Cloudflare Worker for inference + data plane

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
| Concierge controls | Headset = voice turn · mic = one question · ■ = stop · Send = text · language picker |
| Voice conversation | Open Ask AI, then **Hey Wick** or tap the mic. The mic is off while it talks; a 6-second follow-up window then returns it to off. **Wait** holds that window. ■ cuts a reply |
| In-app browsers | LinkedIn/WebView often block mic — UI hints to open in Safari/Chrome; **text chat still works** |

## Portfolio Concierge

Live demo: prompt-grounded LLM over curated portfolio knowledge (experience, projects, thesis, contact), with optional voice.

| Layer | Detail |
|--------|--------|
| UI | `src/components/concierge/Concierge.jsx`, `VoiceWaveIcon.jsx`, `ReplyBody.jsx` |
| Speech I/O | `src/lib/voice.js` — **hybrid STT**: Web Speech when available (0 STT Neurons); else `MediaRecorder` → Workers AI **Whisper** (`POST /stt`). TTS = browser `speechSynthesis` |
| Replies | `src/lib/formatReply.js` — lists, bold, and links in the bubble; TTS speaks a stripped version |
| Knowledge | `worker/src/knowledge.js` — keep claims aligned with `src/customization/*.json` |
| Client API | `src/lib/conciergeApi.js` — chat `POST /`, STT `POST /stt` |
| Edge | `worker/` + `@cf/meta/llama-3.1-8b-instruct-fast` + `@cf/openai/whisper-tiny-en` |
| Endpoint | `https://ritwik-portfolio-concierge.wick19.workers.dev` |

**Architecture choice:** prompt-grounded generation (fixed personal knowledge pack in the system prompt), not a vector RAG store — correct fit for a bounded portfolio corpus. Speech stays client-side when the browser supports it so Neurons go to reasoning; Whisper is the universal fallback (Firefox / missing Web Speech).

### Voice conversation (privacy-first, Siri-style)

The page does **not** listen while Ask AI is closed. It also releases the mic while the Concierge thinks or speaks, and after a short follow-up window. This keeps the interaction intentional: visitors opt in to voice, retain a clear stop control, and never see a permanently active microphone.

| Step | What happens |
|------|----------------|
| Open **Ask AI**, allow the mic | Wake listen starts only inside the panel |
| **Hey Wick** or tap the mic | One question. “Hey Wick, tell me about Sprouts” also works |
| Thinking / speaking | Mic **off**. Tap **■** to cut the reply |
| After the answer | ~6 seconds to ask a follow-up (no Wick needed) |
| **Wait** / **Hold on** | Only in that 6s window — keeps the mic a bit longer |
| Stay quiet or tap **■** | Sleep. Mic fully off. Headset or mic to talk again |

### Language support

The language control applies an explicit locale to browser speech recognition and synthesis, so the Concierge can align spoken input and output with the visitor’s selected language when that capability is available.

| Group | Selectable languages |
|---|---|
| Auto | Auto detection |
| English | English · English (India) |
| India | Hindi (हिन्दी) · Bengali (বাংলা) · Telugu (తెలుగు) · Marathi (मराठी) · Tamil (தமிழ்) · Gujarati (ગુજરાતી) · Kannada (ಕನ್ನಡ) · Malayalam (മലയാളം) · Punjabi (ਪੰਜਾਬੀ) · Urdu (اردو) |
| Europe | Spanish (Español) · French (Français) · German (Deutsch) |

**Compatibility note:** availability of speech recognition and voices depends on the visitor’s browser and operating system. Chrome and Safari provide the best experience. When browser speech recognition is unavailable, the Worker falls back to Workers AI Whisper for **English** audio; visitors can always type in any language. The Concierge is instructed to answer in the visitor’s language when it can.

How-to copy is shown in full before the first message, then collapses to **// How to use**.

### Automated live data refresh (edge cron + cache)

Beyond inference, the same Worker runs a **scheduled upstream pull** so Contact-facing proof metrics stay current without a client-driven poll loop.

| Piece | Implementation |
|--------|----------------|
| Trigger | Cloudflare **Cron Triggers** — `0 0,8,16 * * *` (00:00 / 08:00 / 16:00 UTC, 3x/day) via `wrangler.toml` `[triggers]` |
| Handler | Worker `scheduled()` → `ctx.waitUntil(refresh…)` so the cron finishes after the response path returns |
| Upstream call | Server-side `fetch` — LeetCode GraphQL first, public stats API fallback; normalize + validate before write |
| Shared store | **Cache API** key (`concierge.cache/…`) with `Cache-Control: max-age` aligned to next UTC midnight |
| Read path | `GET /leetcode` — returns the snapshot instantly if younger than a short freshness window (~120s); otherwise pulls fresh from upstream so page opens see near real-time stats. `?fresh=1` forces a refresh. Response is `Cache-Control: no-store`; the UI revalidates on every open |
| Client | On every Contact open, **Open profile**, or **LeetCode** click: live public API + Worker `?fresh=1` in parallel; keep the higher solved count so a stale Worker snapshot cannot hide new problems |

**Why this shape:** the source of truth lives at the edge, not in each visitor’s `localStorage`. A single scheduled job amortizes the upstream call; every subsequent page load reads a warm snapshot. That is the same pattern used for low-cost “live” badges and third-party KPI surfaces when you do not need a full database.

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
