/**
 * Browser voice helpers (Web Speech API).
 * Free — no Workers AI neurons. Best in Chromium; graceful fallback elsewhere.
 */

export function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function canUseVoiceInput() {
  return Boolean(getSpeechRecognitionCtor());
}

export function canUseVoiceOutput() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * @returns {{ start: () => void, stop: () => void, abort: () => void } | null}
 */
export function createSpeechListener({
  onPartial,
  onFinal,
  onError,
  onEnd,
  lang = "en-US",
} = {}) {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interim = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) finalText += piece;
      else interim += piece;
    }
    if (interim && onPartial) onPartial(interim.trim());
    if (finalText && onFinal) onFinal(finalText.trim());
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error || "speech_error");
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    start() {
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    },
    stop() {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    abort() {
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

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(String(text).slice(0, 1200));
  utter.rate = rate;
  utter.pitch = 1;
  utter.lang = "en-US";

  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /en(-|_)US/i.test(v.lang) && /Google|Samantha|Natural/i.test(v.name)) ||
    voices.find((v) => /en(-|_)US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang));
  if (preferred) utter.voice = preferred;

  utter.onend = () => {
    if (onEnd) onEnd();
  };
  utter.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utter);
  return () => window.speechSynthesis.cancel();
}

export function stopSpeaking() {
  if (canUseVoiceOutput()) window.speechSynthesis.cancel();
}
