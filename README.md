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
- **Portfolio Concierge** — live Ask AI demo (Cloudflare Workers AI / Llama 3.1 fast)

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

## Portfolio Concierge (working)

Floating **Ask AI** panel grounded in portfolio facts (experience, projects, thesis, contact).

| Piece | Detail |
|--------|--------|
| Frontend | `src/components/concierge/Concierge.jsx` |
| API client | `src/lib/conciergeApi.js` |
| Backend | Cloudflare Worker in `worker/` |
| Model | `@cf/meta/llama-3.1-8b-instruct-fast` (Workers AI free tier) |
| Live Worker | `https://ritwik-portfolio-concierge.wick19.workers.dev` |

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

### Cost & abuse protection (important)

This Concierge uses **Cloudflare Workers AI free neurons**, not a paid OpenAI/Gemini bill — but abuse can still burn free quota or (if you leave paid billing on) create cost. Protections already in the Worker:

| Control | What it does |
|---------|----------------|
| Origin allowlist | Only `wick19.github.io` + local Vite origins can POST |
| Rate limits | ~3/min/IP, ~10/hour/IP, ~120/day global (Cache API) |
| Payload caps | Short messages, short history, low `max_tokens` |
| Kill switch | Set `CONCIERGE_ENABLED=false` in Worker vars → instant pause |
| **Daily free-quota kill** | On Workers AI **4006** (10,000 Neurons/day used), auto-pause until **00:00 UTC** |
| Optional token | `ACCESS_TOKEN` secret + `VITE_CONCIERGE_TOKEN` header |
| UI cooldown | ~2.5s between sends in the browser |

**Free quota (Cloudflare Workers AI):** **10,000 Neurons per day**, resets at **00:00 UTC**. On the Free Workers plan, going over fails (no paid overage). On Paid, overage can bill — keep a $0–$1 billing alert.

1. Stay on the **Free** Workers / Workers AI plan if possible.
2. Open **Billing →** set a **low spending limit / alert** (ideally $0–$1) so a spike cannot run up a card.
3. Watch **Workers AI usage / neurons** periodically.
4. If anything looks wrong: set Worker var `CONCIERGE_ENABLED` = `false` and redeploy (or edit in dashboard), or delete/disable the Worker.

**Hardening plan (recommended next steps):**

1. **Now (done in code):** origin lock + rate limits + kill switch + optional access token + small generations.
2. **This week:** set `ACCESS_TOKEN` / `VITE_CONCIERGE_TOKEN` to a long random string; redeploy Worker + site.
3. **Stronger bot filter:** add [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) (free) so only real browsers get a one-time token before chat.
4. **Durable limits:** move counters to Workers KV or Durable Objects if traffic grows (Cache API is best-effort).
5. **Observability:** enable Workers logs; alert on 429/502 spikes.
6. **Nuclear option:** remove `VITE_CONCIERGE_URL` and redeploy the static site (UI shows disconnected), or unpublish the Worker.

Prompt injection cannot empty your bank on this design (no paid provider key in the app), but it can waste neurons — grounding + short outputs + rate limits keep that bounded.

## Deploy site

```bash
npm run deploy
```

Publishes the `dist` build to GitHub Pages (`gh-pages`).
