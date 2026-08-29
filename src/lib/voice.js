/**
 * Browser voice helpers.
 * - Desktop Chromium/Safari: Web Speech API (0 Workers AI STT Neurons)
 * - Firefox / mobile / fallback: MediaRecorder → Workers AI Whisper
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
 * Prefer free on-device STT on desktop when available.
 * Mobile + Firefox use cloud Whisper (universal + more reliable).
 */
export function preferBrowserStt() {
  return canUseVoiceInput() && !isMobileVoiceClient();
}

export function canUseVoiceOutput() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Desktop analyser only when using browser STT (not dual-mic with SpeechRecognition on mobile). */
export function shouldUseMicMeter() {
  if (typeof navigator === "undefined") return false;
  if (!preferBrowserStt()) return false;
  return Boolean(window.AudioContext || window.webkitAudioContext);
}

export function isMobileVoiceClient() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
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

function pickEnglishVoice() {
  const voices = window.speechSynthesis.getVoices() || [];
  return (
    voices.find(
      (v) =>
        /en(-|_)US/i.test(v.lang) &&
        /Google|Samsung|Samantha|Siri|Natural|Enhanced/i.test(v.name)
    ) ||
    voices.find((v) => /en(-|_)US/i.test(v.lang)) ||
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
  recognition.maxAlternatives = 1;

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
      const piece = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) finalText += piece;
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

export function speakText(text, { onEnd, rate = 1.02 } = {}) {
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
    utter.lang = "en-US";
    const preferred = pickEnglishVoice();
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
  silenceMs = 1400,
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
        const level = avg < 0.08 ? 0 : Math.min(1, (avg - 0.08) / 0.42);
        if (onLevel) onLevel(level);

        if (level > 0.12) {
          heardSpeech = true;
          if (silenceTimer) {
            window.clearTimeout(silenceTimer);
            silenceTimer = 0;
          }
        } else if (
          heardSpeech &&
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
