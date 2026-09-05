/**
 * Headless Chrome smoke: desktop + iPhone-size viewports.
 * Usage: node scripts/smoke-ui.mjs
 */
import { spawn } from "node:child_process";
import { once } from "node:events";

const BASE = process.env.SMOKE_URL || "http://127.0.0.1:5173/web-portfolio/";
const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9229;

const ROUTES = [
  { hash: "#home", must: ["Ritwik", "Full-stack AI/ML Engineer", "Capability Atlas"] },
  { hash: "#projects-page", must: ["Selected systems", "Portfolio Concierge"] },
  { hash: "#thesis-page", must: ["Path loss", "Okumura"] },
  { hash: "#experience-page", must: ["Career history", "Sprouts.ai", "AI Engineer"] },
  {
    hash: "#experience-page?org=adidas",
    must: ["Adidas", "Campus Ambassador"],
  },
  { hash: "#certification-page", must: ["Certification archive"] },
  {
    hash: "#contact-page",
    must: ["Let's talk", "LeetCode", "Solved", "Open profile"],
  },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14", width: 390, height: 844 },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cdpSession(wsUrl) {
  let nextId = 1;
  let socket;
  const pending = new Map();

  async function connect() {
    socket = new WebSocket(wsUrl);
    await once(socket, "open");
    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      const waiter = pending.get(msg.id);
      if (!waiter) return;
      pending.delete(msg.id);
      if (msg.error) waiter.reject(new Error(JSON.stringify(msg.error)));
      else waiter.resolve(msg.result);
    });
  }

  async function send(method, params = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) await connect();
    const id = nextId++;
    const reply = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`CDP timeout ${method}`)),
        20000
      );
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
    });
    socket.send(JSON.stringify({ id, method, params }));
    return reply;
  }

  function close() {
    try {
      socket?.close();
    } catch {
      /* ignore */
    }
  }

  return { send, close };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function main() {
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=/tmp/portfolio-smoke-chrome",
    ],
    { stdio: "ignore" }
  );
  await sleep(800);

  const results = [];
  const session = { send() {}, close() {} };
  try {
    let pages = [];
    for (let i = 0; i < 10 && !pages.length; i += 1) {
      try {
        pages = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
      } catch {
        await sleep(200);
      }
    }
    if (!pages.length) throw new Error("Chrome CDP did not expose a page");
    const page = pages.find((p) => p.type === "page") || pages[0];
    Object.assign(session, cdpSession(page.webSocketDebuggerUrl));
    const send = (method, params) => session.send(method, params);

    for (const vp of VIEWPORTS) {
      for (const route of ROUTES) {
        const url = `${BASE}${route.hash}`;
        await send("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: vp.name === "desktop" ? 1 : 3,
          mobile: vp.name !== "desktop",
        });
        await send("Page.enable");
        await send("Runtime.enable");
        await send("Page.navigate", { url });
        await sleep(1400);
        const evaled = await send("Runtime.evaluate", {
          returnByValue: true,
          expression: `(() => {
            const body = document.body && document.body.innerText ? document.body.innerText : "";
            const fab = document.querySelector(".concierge-fab");
            const text = body + " " + (fab && fab.textContent ? fab.textContent : "");
            const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
            const askBox = fab ? fab.getBoundingClientRect() : null;
            return {
              title: document.title,
              text: text,
              overflowX: overflowX,
              askVisible: Boolean(fab && askBox && askBox.width > 0 && askBox.bottom <= window.innerHeight + 8),
              askLabel: fab && fab.textContent ? fab.textContent : "",
            };
          })()`,
        });
        const value = evaled.result.value;
        const missing = route.must.filter((s) => !value.text.includes(s));
        const row = {
          viewport: vp.name,
          route: route.hash,
          ok: missing.length === 0 && value.overflowX <= 8,
          missing,
          overflowX: value.overflowX,
          askLabel: value.askLabel,
          askVisible: value.askVisible,
        };
        results.push(row);
        const mark = row.ok ? "PASS" : "FAIL";
        console.log(
          `${mark}  ${vp.name.padEnd(10)} ${route.hash}  overflowX=${value.overflowX}  ask="${value.askLabel}"`
        );
        if (missing.length) {
          console.log(`       missing: ${missing.join(" | ")}`);
          console.log(`       snippet: ${value.text.replace(/\s+/g, " ").slice(0, 220)}`);
        }
      }
    }

    // Concierge panel checks on mobile
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await send("Page.navigate", { url: `${BASE}#home` });
    await sleep(1400);
    await send("Runtime.evaluate", {
      expression: `document.querySelector(".concierge-fab")?.click()`,
    });
    await sleep(600);
    const panel = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const panel = document.querySelector(".concierge-panel");
        const box = panel?.getBoundingClientRect();
        const text = panel?.innerText || "";
        const lang = document.querySelector(".concierge-header-tools")?.innerText || "";
        return {
          open: Boolean(panel),
          width: box?.width || 0,
          height: box?.height || 0,
          viewportW: window.innerWidth,
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          hasWake: text.includes("Wick"),
          hasStop: text.includes("Stop"),
          hasLang: /English|Hindi|Auto|Detect/i.test(lang + text),
          hasSend: Boolean(document.querySelector(".concierge-send")),
          chips: [...document.querySelectorAll(".concierge-chip")].map((el) => el.textContent),
        };
      })()`,
    });
    const p = panel.result.value;
    const panelOk =
      p.open &&
      p.width <= p.viewportW + 2 &&
      p.hasWake &&
      p.hasStop &&
      p.hasSend &&
      p.overflowX <= 8;
    results.push({
      viewport: "iphone-14",
      route: "concierge-open",
      ok: panelOk,
      details: p,
    });
    console.log(
      `${panelOk ? "PASS" : "FAIL"}  iphone-14   concierge-open  w=${Math.round(p.width)}/${p.viewportW}  wick=${p.hasWake} stop=${p.hasStop}`
    );
    if (!panelOk) console.log(p);

    await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector("#concierge-input");
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, "List his jobs as bullets");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        document.querySelector(".concierge-send")?.click();
      })()`,
    });
    let chat = { hasReply: false, hasList: false, folded: false, replySnippet: "" };
    for (let i = 0; i < 16; i += 1) {
      await sleep(500);
      const check = await send("Runtime.evaluate", {
        returnByValue: true,
        expression: `(() => {
          const bubbles = document.querySelectorAll(".concierge-rich, .concierge-msg, .concierge-thread p, .concierge-thread li");
          const list = document.querySelector(".concierge-rich ul, .concierge-thread ul");
          const fold = document.querySelector(".concierge-wake-toggle");
          const err = document.querySelector(".concierge-error");
          const thinking = document.querySelector(".concierge-typing");
          return {
            hasReply: bubbles.length > 0 && !thinking,
            hasList: Boolean(list),
            folded: Boolean(fold),
            error: err ? err.textContent : "",
            replySnippet: (document.querySelector(".concierge-thread")?.innerText || "").slice(0, 220),
          };
        })()`,
      });
      chat = check.result.value;
      if (chat.error || (chat.hasReply && !chat.replySnippet.includes("Thinking"))) break;
    }
    const chatOk = chat.hasReply && !chat.error;
    results.push({ viewport: "iphone-14", route: "concierge-text", ok: chatOk, details: chat });
    console.log(
      `${chatOk ? "PASS" : "FAIL"}  iphone-14   concierge-text  list=${chat.hasList} fold=${chat.folded}`
    );
    console.log(`       ${chat.error || chat.replySnippet.replace(/\\s+/g, " ")}`);
  } finally {
    session.close();
    chrome.kill("SIGTERM");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
