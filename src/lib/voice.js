/**
 * Browser voice helpers.
 * - Desktop Chromium/Safari: Web Speech API (0 Workers AI STT Neurons)
 * - Firefox / mobile / fallback: MediaRecorder → Workers AI Whisper
 * - Hands-free: “Hey Wick” after Ask AI is open; Wait holds the follow-up window
 */

export function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function canUseVoiceInput() {
  return Boolean(getSpeechRecognitionCtor());
}

export function canUseCloudSttCapture() {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/** Mic input via browser STT and/or cloud Whisper capture. */
export function canUseAnyVoiceInput() {
  return canUseVoiceInput() || canUseCloudSttCapture();
}

/**
 * Prefer free on-device STT whenever the browser exposes it (desktop + mobile
 * Chrome/Safari). Whisper is for Firefox / missing API / soft fallbacks.
 * Never pair a second getUserMedia meter with SpeechRecognition on mobile.
 */
export function preferBrowserStt() {
  return canUseVoiceInput();
}

export function canUseVoiceOutput() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Analyser mic meter only on desktop browser-STT (avoids Android mic conflicts). */
export function shouldUseMicMeter() {
  if (typeof navigator === "undefined") return false;
  if (!preferBrowserStt()) return false;
  if (isMobileVoiceClient()) return false;
  return Boolean(window.AudioContext || window.webkitAudioContext);
}

export function isMobileVoiceClient() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

/**
 * LinkedIn / Instagram / Facebook / generic WebViews often block or break mic access.
 * Detect so the UI can nudge visitors to open in Chrome/Safari.
 */
export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /LinkedInApp|LinkedInBot|FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|MicroMessenger/i.test(
      ua
    ) ||
    // Android WebView marker (LinkedIn/in-app browsers)
    (/Android/i.test(ua) && /; wv\)/i.test(ua)) ||
    // iOS in-app often lacks "Safari" while including mobile markers
    (/iPhone|iPad|iPod/i.test(ua) &&
      !/Safari/i.test(ua) &&
      /AppleWebKit/i.test(ua))
  );
}

/** Best-effort link to leave an in-app WebView for real Chrome/Safari. */
export function getExternalBrowserUrl(pageUrl = "https://wick19.github.io/web-portfolio/") {
  if (typeof navigator === "undefined") return pageUrl;
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) {
    const hostPath = pageUrl.replace(/^https?:\/\//, "");
    return `intent://${hostPath}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`;
  }
  return pageUrl;
}

/**
 * Ask for mic once (then release). Helps Android/iOS show the permission prompt
 * before Web Speech starts — otherwise recognition can "listen" with no audio.
 */
export async function ensureMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
  stream.getTracks().forEach((t) => t.stop());
}

/**
 * Warm up speechSynthesis on a user gesture (required on many mobile browsers
 * before async TTS after a network round-trip).
 */
export function unlockSpeechAudio() {
  if (!canUseVoiceOutput()) return;
  try {
    window.speechSynthesis.cancel();
    const warm = new SpeechSynthesisUtterance("");
    warm.volume = 0;
    warm.rate = 1;
    warm.lang = "en-US";
    window.speechSynthesis.speak(warm);
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export const VOICE_LANG_GROUPS = [
  {
    id: "detect",
    label: "Detect",
    options: [{ id: "auto", label: "Auto" }],
  },
  {
    id: "english",
    label: "English",
    options: [
      { id: "en-US", label: "English" },
      { id: "en-IN", label: "English · India" },
    ],
  },
  {
    id: "india",
    label: "India",
    options: [
      { id: "hi-IN", label: "Hindi · हिन्दी" },
      { id: "bn-IN", label: "Bengali · বাংলা" },
      { id: "te-IN", label: "Telugu · తెలుగు" },
      { id: "mr-IN", label: "Marathi · मराठी" },
      { id: "ta-IN", label: "Tamil · தமிழ்" },
      { id: "gu-IN", label: "Gujarati · ગુજરાતી" },
      { id: "kn-IN", label: "Kannada · ಕನ್ನಡ" },
      { id: "ml-IN", label: "Malayalam · മലയാളം" },
      { id: "pa-IN", label: "Punjabi · ਪੰਜਾਬੀ" },
      { id: "ur-IN", label: "Urdu · اردو" },
    ],
  },
  {
    id: "europe",
    label: "Europe",
    options: [
      { id: "es-ES", label: "Spanish · Español" },
      { id: "fr-FR", label: "French · Français" },
      { id: "de-DE", label: "German · Deutsch" },
    ],
  },
];

export const VOICE_LANGS = VOICE_LANG_GROUPS.flatMap((group) => group.options);

const LANG_IDS = new Set(
  VOICE_LANGS.map((l) => l.id).filter((id) => id !== "auto")
);

export function detectLangFromText(text) {
  const src = String(text || "");
  if (/[\u0B80-\u0BFF]/.test(src)) return "ta-IN";
  if (/[\u0C00-\u0C7F]/.test(src)) return "te-IN";
  if (/[\u0C80-\u0CFF]/.test(src)) return "kn-IN";
  if (/[\u0D00-\u0D7F]/.test(src)) return "ml-IN";
  if (/[\u0A80-\u0AFF]/.test(src)) return "gu-IN";
  if (/[\u0A00-\u0A7F]/.test(src)) return "pa-IN";
  if (/[\u0980-\u09FF]/.test(src)) return "bn-IN";
  if (/[\u0600-\u06FF]/.test(src)) return "ur-IN";
  if (/[\u0900-\u097F]/.test(src)) return "hi-IN";
  return null;
}

export function resolveVoiceLang(pref = "auto", textHint = "") {
  if (pref && LANG_IDS.has(pref)) return pref;
  const fromText = detectLangFromText(textHint);
  if (fromText && LANG_IDS.has(fromText)) return fromText;
  const nav =
    typeof navigator !== "undefined" ? String(navigator.language || "en-US") : "en-US";
  if (LANG_IDS.has(nav)) return nav;
  const prefix = nav.slice(0, 2).toLowerCase();
  const match = [...LANG_IDS].find((id) => id.toLowerCase().startsWith(prefix));
  return match || "en-US";
}

export const WAKE_WORD = "Wick";
/** Exact phrase plus how Chrome/Safari often hear “Wick”. Only match at the start. */
const WAKE_HEADS = [
  "wick",
  "vic",
  "vick",
  "vik",
  "wiki",
  "wic",
  "wig",
  "week",
  "wake",
];
const WAKE_PREFIXES = ["hey ", "ok ", "okay ", "hi "];
export const WAKE_PHRASES = [
  ...WAKE_HEADS,
  ...WAKE_PREFIXES.flatMap((prefix) => WAKE_HEADS.map((head) => `${prefix}${head}`)),
];
export const HOLD_PHRASES = ["hold on", "wait"];
export const STOP_PHRASES = ["wick stop", "stop"];

function normalizeUtterance(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function remainderAfterPhrase(raw, phrase) {
  const normalized = normalizeUtterance(raw);
  if (normalized === phrase) return "";
  if (!normalized.startsWith(`${phrase} `)) return null;
  const skip = phrase.split(/\s+/).length;
  return String(raw)
    .trim()
    .split(/\s+/)
    .slice(skip)
    .join(" ")
    .replace(/^[,.:-]+\s*/, "")
    .trim();
}

/**
 * Voice-mode gate: ignore background talk until the visitor says “Wick”.
 * - "Wick" alone → arm the next utterance
 * - "Wick, tell me about Sprouts" → command
 */
export function parseWakeUtterance(text, { armed = false } = {}) {
  const raw = String(text || "").trim();
  if (!raw) return { action: "ignore" };
  if (armed) return { action: "command", command: raw };

  const normalized = normalizeUtterance(raw);
  if (!normalized) return { action: "ignore" };

  const sorted = [...WAKE_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    const rest = remainderAfterPhrase(raw, phrase);
    if (rest === null) continue;
    if (!rest) return { action: "arm" };
    return { action: "command", command: rest };
  }

  if (/\bwick\b/i.test(normalized)) {
    const stripped = raw
      .replace(/^\s*(?:hey |ok |okay |hi )?wick\b[,.\s:-]*/i, "")
      .trim();
    return stripped
      ? { action: "command", command: stripped }
      : { action: "arm" };
  }

  return { action: "ignore" };
}

/**
 * Only while the mic is on (ask turn or 6s follow-up). Not used during TTS.
 * - "Wait" / "Hold on" → keep the follow-up window
 * - "Stop" → sleep
 * - "Stop, what about the thesis?" → ask that instead
 */
export function parseInterruptUtterance(text) {
  const raw = String(text || "").trim();
  if (!raw) return { action: "ignore" };

  const holds = [...HOLD_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of holds) {
    const rest = remainderAfterPhrase(raw, phrase);
    if (rest === null) continue;
    if (!rest) return { action: "hold" };
    return { action: "redirect", command: rest };
  }

  const stops = [...STOP_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of stops) {
    const rest = remainderAfterPhrase(raw, phrase);
    if (rest === null) continue;
    if (!rest) return { action: "stop" };
    return { action: "redirect", command: rest };
  }

  return { action: "ignore" };
}

function pickVoiceForLang(lang = "en-US") {
  const voices = window.speechSynthesis.getVoices() || [];
  const wanted = String(lang || "en-US").replace("_", "-");
  const prefix = wanted.slice(0, 2).toLowerCase();
  const norm = (v) => String(v.lang || "").replace("_", "-");
  return (
    voices.find(
      (v) =>
        norm(v).toLowerCase() === wanted.toLowerCase() &&
        /Google|Samsung|Samantha|Siri|Natural|Enhanced|Microsoft|Premium/i.test(
          v.name
        )
    ) ||
    voices.find((v) => norm(v).toLowerCase() === wanted.toLowerCase()) ||
    voices.find((v) => norm(v).toLowerCase().startsWith(prefix)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null
  );
}

/**
 * Robust STT listener.
 * - Commits last interim transcript on end if the engine never marks isFinal
 *   (common on Android Chrome).
 * - Emits onActivity from sound/speech events for the wave UI (no second mic).
 *
 * @returns {{ start: () => void, stop: () => void, abort: () => void } | null}
 */
/** Prefer an alternative that is a wake or stop phrase — Chrome often ranks “Vic” over “Wick”. */
function pickUtteranceFromResult(result) {
  if (!result?.length) return "";
  const alts = [];
  for (let i = 0; i < result.length; i += 1) {
    const text = String(result[i]?.transcript || "").trim();
    if (text) alts.push(text);
  }
  if (!alts.length) return "";
  const useful = alts.find((text) => {
    const wake = parseWakeUtterance(text);
    if (wake.action !== "ignore") return true;
    return parseInterruptUtterance(text).action !== "ignore";
  });
  return useful || alts[0];
}

export function createSpeechListener({
  onPartial,
  onFinal,
  onError,
  onEnd,
  onActivity,
  lang = "en-US",
} = {}) {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  // continuous=false is more portable; Concierge restarts the session in voice loop.
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 5;

  let lastInterim = "";
  let committed = false;
  let stoppedByUs = false;

  const commit = (text) => {
    const value = String(text || "").trim();
    if (!value || committed) return false;
    committed = true;
    if (onFinal) onFinal(value);
    return true;
  };

  recognition.onresult = (event) => {
    let interim = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const piece = pickUtteranceFromResult(result);
      if (result.isFinal) finalText += piece;
      else interim += piece;
    }
    if (interim) {
      lastInterim = interim.trim();
      if (onPartial) onPartial(lastInterim);
      if (onActivity) onActivity(true);
    }
    if (finalText) {
      lastInterim = "";
      commit(finalText);
    }
  };

  recognition.onsoundstart = () => {
    if (onActivity) onActivity(true);
  };
  recognition.onspeechstart = () => {
    if (onActivity) onActivity(true);
  };
  recognition.onsoundend = () => {
    if (onActivity) onActivity(false);
  };
  recognition.onspeechend = () => {
    if (onActivity) onActivity(false);
  };

  recognition.onerror = (event) => {
    const code = event.error || "speech_error";
    // Aborted by us / no-speech are soft — Concierge decides whether to retry.
    if (onError) onError(code, { soft: code === "no-speech" || code === "aborted" });
  };

  recognition.onend = () => {
    if (onActivity) onActivity(false);
    // Android often ends with only interim results — promote them.
    if (!committed && lastInterim) {
      commit(lastInterim);
    }
    if (onEnd) onEnd({ committed, stoppedByUs });
  };

  return {
    start() {
      committed = false;
      lastInterim = "";
      stoppedByUs = false;
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    },
    stop() {
      stoppedByUs = true;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    abort() {
      stoppedByUs = true;
      committed = true; // prevent interim commit after abort
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    },
  };
}

export function speakText(text, { onEnd, rate = 1.02, lang = "en-US" } = {}) {
  if (!canUseVoiceOutput() || !text) {
    if (onEnd) onEnd();
    return () => {};
  }

  let cancelled = false;
  let spoke = false;
  let safetyTimer = 0;

  const finish = () => {
    if (safetyTimer) window.clearTimeout(safetyTimer);
    safetyTimer = 0;
    if (onEnd) onEnd();
  };

  const run = () => {
    if (cancelled || spoke) return;
    spoke = true;

    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    // Some Android Chrome builds pause the synth until resume().
    try {
      window.speechSynthesis.resume();
    } catch {
      /* ignore */
    }

    const utter = new SpeechSynthesisUtterance(String(text).slice(0, 1200));
    utter.rate = isMobileVoiceClient() ? Math.min(rate, 1) : rate;
    utter.pitch = 1;
    utter.lang = lang || "en-US";
    const preferred = pickVoiceForLang(utter.lang);
    if (preferred) utter.voice = preferred;

    utter.onend = finish;
    utter.onerror = finish;

    // Safety: if onend never fires (known mobile bug), unblock the voice loop.
    const ms = Math.min(60000, Math.max(4000, String(text).length * 80));
    safetyTimer = window.setTimeout(finish, ms);

    try {
      window.speechSynthesis.speak(utter);
      // iOS / Android sometimes need a kick after speak()
      window.setTimeout(() => {
        try {
          window.speechSynthesis.resume();
        } catch {
          /* ignore */
        }
      }, 40);
    } catch {
      finish();
    }
  };

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      run();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    window.setTimeout(run, 300);
  } else {
    run();
  }

  return () => {
    cancelled = true;
    if (safetyTimer) window.clearTimeout(safetyTimer);
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  };
}

export function stopSpeaking() {
  if (canUseVoiceOutput()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Live mic amplitude (0–1) via Web Audio AnalyserNode.
 * Desktop browser-STT path only.
 * @returns {{ start: () => Promise<void>, stop: () => void }}
 */
export function createMicLevelMeter({ onLevel } = {}) {
  let stream = null;
  let ctx = null;
  let analyser = null;
  let raf = 0;
  let stopped = true;
  let data = new Uint8Array(128);

  function report(level) {
    if (onLevel) onLevel(level);
  }

  function tick() {
    if (stopped || !analyser) return;
    analyser.getByteFrequencyData(data);
    let sum = 0;
    const bins = Math.min(40, data.length);
    for (let i = 0; i < bins; i += 1) sum += data[i];
    const avg = sum / bins / 255;
    const gated = avg < 0.08 ? 0 : Math.min(1, (avg - 0.08) / 0.42);
    report(gated);
    raf = requestAnimationFrame(tick);
  }

  const meter = {
    async start() {
      meter.stop();
      stopped = false;
      if (!navigator.mediaDevices?.getUserMedia) {
        report(0);
        return;
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          /* ignore */
        }
      }
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      data = new Uint8Array(analyser.frequencyBinCount);
      ctx.createMediaStreamSource(stream).connect(analyser);
      raf = requestAnimationFrame(tick);
    },
    stop() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      if (ctx) {
        ctx.close().catch(() => {});
        ctx = null;
      }
      analyser = null;
      report(0);
    },
  };

  return meter;
}

export function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      /* ignore */
    }
  }
  return "";
}

/**
 * Record a short utterance for Workers AI Whisper.
 * Stops on maxMs, sustained silence after speech, or stop()/abort().
 */
export async function startCloudUtterance({
  maxMs = 8000,
  silenceMs = 1800,
  minMs = 2200,
  onLevel,
} = {}) {
  if (!canUseCloudSttCapture()) {
    throw new Error("Audio recording is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });

  const mimeType = pickRecorderMimeType();
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);
  const chunks = [];
  let settled = false;
  let maxTimer = 0;
  let silenceTimer = 0;
  let raf = 0;
  let ctx = null;
  let heardSpeech = false;
  let aborted = false;
  const startedAt = Date.now();

  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    try {
      ctx = new AC();
      if (ctx.state === "suspended") await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (settled) return;
        analyser.getByteFrequencyData(data);
        let sum = 0;
        const bins = Math.min(40, data.length);
        for (let i = 0; i < bins; i += 1) sum += data[i];
        const avg = sum / bins / 255;
        const level = avg < 0.1 ? 0 : Math.min(1, (avg - 0.1) / 0.4);
        if (onLevel) onLevel(level);

        const elapsed = Date.now() - startedAt;
        if (level > 0.18) {
          heardSpeech = true;
          if (silenceTimer) {
            window.clearTimeout(silenceTimer);
            silenceTimer = 0;
          }
        } else if (
          heardSpeech &&
          elapsed >= minMs &&
          !silenceTimer &&
          recorder.state === "recording"
        ) {
          silenceTimer = window.setTimeout(() => {
            silenceTimer = 0;
            if (recorder.state === "recording") recorder.stop();
          }, silenceMs);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } catch {
      /* level meter optional */
    }
  }

  function cleanup() {
    if (maxTimer) window.clearTimeout(maxTimer);
    if (silenceTimer) window.clearTimeout(silenceTimer);
    if (raf) cancelAnimationFrame(raf);
    maxTimer = 0;
    silenceTimer = 0;
    raf = 0;
    if (onLevel) onLevel(0);
    stream.getTracks().forEach((t) => t.stop());
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
    }
  }

  const done = new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    recorder.onerror = () => {
      cleanup();
      if (!settled) {
        settled = true;
        reject(new Error("Recording failed"));
      }
    };
    recorder.onstop = () => {
      cleanup();
      if (settled) return;
      settled = true;
      if (aborted) {
        reject(new Error("aborted"));
        return;
      }
      const type = recorder.mimeType || mimeType || "audio/webm";
      resolve(new Blob(chunks, { type }));
    };
  });

  recorder.start(250);
  maxTimer = window.setTimeout(() => {
    if (recorder.state === "recording") recorder.stop();
  }, maxMs);

  return {
    mimeType: recorder.mimeType || mimeType || "audio/webm",
    done,
    stop() {
      if (recorder.state === "recording") recorder.stop();
    },
    abort() {
      aborted = true;
      try {
        if (recorder.state === "recording") recorder.stop();
        else cleanup();
      } catch {
        cleanup();
      }
    },
  };
}
