#!/usr/bin/env node
/**
 * Stdio → HTTP proxy for Google Stitch MCP.
 * Strips tools/list `outputSchema` so Cursor can register tools
 * (raw Stitch schemas are huge / have a dangling $ref that Cursor rejects).
 */

import { createInterface } from "readline";
import { request } from "https";

const API_KEY = process.env.STITCH_API_KEY;
const STITCH_URL = "https://stitch.googleapis.com/mcp";

if (!API_KEY) {
  process.stderr.write("STITCH_API_KEY env var is required\n");
  process.exit(1);
}

function parseStitchBody(raw) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Empty response from Stitch");

  // Plain JSON
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  // SSE: take last data: payload
  let last = null;
  for (const line of trimmed.split(/\r?\n/)) {
    if (line.startsWith("data:")) {
      const payload = line.slice(5).trim();
      if (payload && payload !== "[DONE]") last = payload;
    }
  }
  if (!last) throw new Error(`Unexpected Stitch response: ${trimmed.slice(0, 200)}`);
  return JSON.parse(last);
}

function postToStitch(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(STITCH_URL);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "Content-Length": Buffer.byteLength(data),
        "X-Goog-Api-Key": API_KEY,
      },
    };
    const req = request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve(parseStitchBody(raw));
        } catch (e) {
          reject(new Error(`${e.message}\nHTTP ${res.statusCode}\n${raw.slice(0, 300)}`));
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function stripOutputSchema(response) {
  if (response?.result?.tools && Array.isArray(response.result.tools)) {
    response.result.tools = response.result.tools.map((tool) => {
      const { outputSchema, ...rest } = tool;
      return rest;
    });
  }
  return response;
}

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }

  // Notifications have no id — fire and forget
  if (msg.id === undefined) {
    postToStitch(msg).catch(() => {});
    return;
  }

  try {
    let response = await postToStitch(msg);
    if (msg.method === "tools/list") {
      response = stripOutputSchema(response);
    }
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: msg.id,
        error: { code: -32603, message: String(err.message) },
      }) + "\n"
    );
  }
});
