# Ritwik — Portfolio

Full-stack AI/ML Engineer portfolio (FastAPI, LLMs, cloud-native backends).

## Live site

**[https://wick19.github.io/web-portfolio/](https://wick19.github.io/web-portfolio/)**

## Resume

[View resume (PDF)](https://drive.google.com/file/d/1Zg3EcBev7zBV2fthIor6eBJa_4lVp91s/view?usp=sharing)

## Stack

- React 18 + Vite
- Custom carbon/cyan UI
- Content driven from `src/customization/*.json`
- **Portfolio Concierge** — multimodal Ask AI (LLM + hybrid voice) on Cloudflare Workers AI

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

## Portfolio Concierge

Live product demo: a grounded LLM concierge over portfolio knowledge (experience, projects, thesis, contact), with optional voice conversation.

| Layer | Detail |
|--------|--------|
| UI | `src/components/concierge/Concierge.jsx` + `VoiceWaveIcon.jsx` |
| Speech I/O | `src/lib/voice.js` — **hybrid STT**: desktop Web Speech when available (0 STT Neurons); Firefox/mobile use `MediaRecorder` → Workers AI **Whisper** (`POST /stt`). TTS stays browser `speechSynthesis`. |
| Client API | `src/lib/conciergeApi.js` — chat `POST /`, STT `POST /stt` |
| Edge inference | Cloudflare Worker (`worker/`) + Workers AI `@cf/meta/llama-3.1-8b-instruct-fast` + `@cf/openai/whisper-tiny-en` |
| Endpoint | `https://ritwik-portfolio-concierge.wick19.workers.dev` |

**Controls:** headset = continuous voice session (wave while talking) · mic = single utterance · Send = text.

**Browsers:** Chrome / Edge / Firefox / Safari (desktop + mobile) with mic permission. In-app WebViews that block the mic still need typing.

**Architecture:** prompt-grounded generation (curated portfolio context in the system prompt), not a vector RAG store. Hybrid STT keeps free Neurons on reasoning when browser speech works; Whisper only when needed.

Deploy / update the Worker:

```bash
cd worker
npm install
npx wrangler login   # once
npx wrangler deploy
```

Then rebuild/redeploy the site so `VITE_CONCIERGE_URL` is baked in:

```bash
npm run deploy
```

### Cost & abuse protection

Text replies + Whisper STT use **Cloudflare Workers AI** free Neurons; browser Web Speech / TTS do not. Protections in the Worker:

| Control | What it does |
|---------|----------------|
| Origin allowlist | Only `wick19.github.io` + local Vite origins can POST |
| Chat rate limits | ~3/min/IP, ~10/hour/IP, ~120/day global |
| **STT rate limits** | Stricter: ~2/min/IP, ~6/hour/IP, ~40/day global |
| **Audio caps** | ~8s / ~280KB max; reject tiny/huge payloads |
| Payload caps (chat) | Short messages, short history, low `max_tokens` |
| Kill switch | Set `CONCIERGE_ENABLED=false` in Worker vars → instant pause |
| **Daily free-quota kill** | On Workers AI **4006** (10,000 Neurons/day used), auto-pause until **00:00 UTC** |
| Optional token | `ACCESS_TOKEN` secret + `VITE_CONCIERGE_TOKEN` header |
| UI cooldown | ~2.5s between sends in the browser |

**Free quota:** **10,000 Neurons / day** (resets **00:00 UTC**). Prefer Workers Free + a $0–$1 billing alert. If needed, set `CONCIERGE_ENABLED=false` or unpublish the Worker.

**Hardening next steps:** Cloudflare Turnstile (prefer over a static `VITE_*` token), KV/DO rate counters, Workers logs/alerts.

## Deploy site

```bash
npm run deploy
```

Publishes the `dist` build to GitHub Pages (`gh-pages`).
