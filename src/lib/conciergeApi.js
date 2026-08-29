const DEFAULT_URL = import.meta.env.VITE_CONCIERGE_URL || "";
const ACCESS_TOKEN = import.meta.env.VITE_CONCIERGE_TOKEN || "";

export function getConciergeUrl() {
  return String(DEFAULT_URL || "").replace(/\/$/, "");
}

export function isConciergeConfigured() {
  return Boolean(getConciergeUrl());
}

/**
 * @param {{ role: 'user' | 'assistant', content: string }[]} messages
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function askConcierge(messages, opts = {}) {
  const base = getConciergeUrl();
  if (!base) {
    throw new Error("Concierge URL is not configured");
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (ACCESS_TOKEN) {
    headers["X-Portfolio-Token"] = ACCESS_TOKEN;
  }

  const res = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages }),
    signal: opts.signal,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  if (!data.reply) {
    throw new Error("Empty reply from concierge");
  }

  return { reply: data.reply, model: data.model };
}

/**
 * Cloud STT via Workers AI Whisper (POST /stt).
 * @param {Blob} blob
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function transcribeAudio(blob, opts = {}) {
  const base = getConciergeUrl();
  if (!base) {
    throw new Error("Concierge URL is not configured");
  }
  if (!blob || !blob.size) {
    throw new Error("No audio to transcribe");
  }

  const headers = {
    Accept: "application/json",
    "Content-Type": blob.type || "application/octet-stream",
    "X-Audio-Format": blob.type || "audio/webm",
  };
  if (ACCESS_TOKEN) {
    headers["X-Portfolio-Token"] = ACCESS_TOKEN;
  }

  const res = await fetch(`${base}/stt`, {
    method: "POST",
    headers,
    body: blob,
    signal: opts.signal,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.error || `Transcription failed (${res.status})`);
  }

  const text = String(data.text || "").trim();
  if (!text) {
    throw new Error("Empty transcription");
  }

  return { text, model: data.model };
}
