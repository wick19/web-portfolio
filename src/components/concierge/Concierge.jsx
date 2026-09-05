import { useEffect, useId, useRef, useState } from "react";
import {
  askConcierge,
  getConciergeUrl,
  isConciergeConfigured,
  transcribeAudio,
} from "../../lib/conciergeApi";
import { stripMarkdown } from "../../lib/formatReply";
import {
  canUseAnyVoiceInput,
  canUseCloudSttCapture,
  canUseVoiceOutput,
  createMicLevelMeter,
  createSpeechListener,
  ensureMicPermission,
  getExternalBrowserUrl,
  detectLangFromText,
  inferReplyLang,
  isInAppBrowser,
  isMobileVoiceClient,
  languageDisplayName,
  parseInterruptUtterance,
  parseWakeUtterance,
  preferBrowserStt,
  resolveVoiceLang,
  shouldUseMicMeter,
  speakText,
  startCloudUtterance,
  stopSpeaking,
  unlockSpeechAudio,
  VOICE_LANG_GROUPS,
  VOICE_LANGS,
  WAKE_WORD,
} from "../../lib/voice";
import ReplyBody from "./ReplyBody";
import VoiceWaveIcon from "./VoiceWaveIcon";

const SUGGESTIONS = [
  "What does Ritwik ship at Sprouts.ai?",
  "Summarize his strongest AI / ML proof",
  "Where should I start on this site?",
];

const WELCOME = "Ask about experience, projects, thesis, or how to reach him.";
const VOICE_HINT = `Say “Hey ${WAKE_WORD}” or tap the mic. After an answer, keep talking — it waits for you.`;

const LANG_KEY = "portfolio:concierge-lang";
const FOLLOWUP_MS = 14000;
const POST_TTS_LISTEN_MS = 450;
const PORTFOLIO_URL = "https://wick19.github.io/web-portfolio/";

function playWakeChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
    osc.onended = () => {
      ctx.close().catch(() => {});
    };
  } catch {
    /* ignore */
  }
}

function readSavedLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && VOICE_LANGS.some((l) => l.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "auto";
}
const EXTERNAL_BROWSER_URL = getExternalBrowserUrl(PORTFOLIO_URL);

function inAppVoiceHint() {
  return "Voice needs a full browser with mic permission. If you opened this from LinkedIn, use ⋯ → Open in browser (Safari/Chrome). Text chat still works here.";
}

function IconHeadset({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12a8 8 0 0 1 16 0" />
      <path d="M4 12v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2z" />
      <path d="M20 12v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconMic({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function IconStop({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function LangPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current =
    VOICE_LANGS.find((lang) => lang.id === value) || VOICE_LANGS[0];

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  return (
    <div className="concierge-lang" ref={rootRef}>
      <button
        type="button"
        className={open ? "concierge-lang-btn is-open" : "concierge-lang-btn"}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current.label}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="concierge-lang-menu" role="listbox" aria-label="Voice language">
          {VOICE_LANG_GROUPS.map((group) => (
            <div key={group.id} className="concierge-lang-group">
              <p className="concierge-lang-group-label">{group.label}</p>
              {group.options.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  role="option"
                  aria-selected={lang.id === value}
                  className={
                    lang.id === value
                      ? "concierge-lang-option is-active"
                      : "concierge-lang-option"
                  }
                  onClick={() => {
                    onChange(lang.id);
                    setOpen(false);
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MessageBubble({ role, content }) {
  return (
    <div
      className={
        role === "user" ? "concierge-msg concierge-msg-user" : "concierge-msg"
      }
    >
      {role === "assistant" ? <ReplyBody text={content} /> : <p>{content}</p>}
    </div>
  );
}

export default function Concierge() {
  const titleId = useId();
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const listenerRef = useRef(null);
  const cloudRecRef = useRef(null);
  const speakCancelRef = useRef(null);
  const voiceLoopRef = useRef(false);
  const meterRef = useRef(null);
  const busyRef = useRef(false);
  const listeningRef = useRef(false);
  const speakingRef = useRef(false);
  const chatAbortRef = useRef(null);
  const restartTimerRef = useRef(0);
  const useMeter = useRef(shouldUseMicMeter());
  const useBrowserStt = useRef(preferBrowserStt());
  const langPrefRef = useRef("auto");
  const openRef = useRef(false);
  const standbyOnRef = useRef(false);
  const standbyListenerRef = useRef(null);
  const standbyRestartRef = useRef(0);
  const phaseRef = useRef("sleep");
  const followupTimerRef = useRef(0);
  const postTtsTimerRef = useRef(0);
  const listenGenRef = useRef(0);
  const lastSentAtRef = useRef(0);
  const fromVoiceRef = useRef(false);
  const lastDetectedRef = useRef("");

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [voiceLang, setVoiceLang] = useState(readSavedLang);
  const [wakeHint, setWakeHint] = useState("");
  const [wakeGuideOpen, setWakeGuideOpen] = useState(false);
  const [voiceSupported] = useState(() => canUseAnyVoiceInput());
  const [inAppBrowser] = useState(() => isInAppBrowser());
  const configured = isConciergeConfigured();

  langPrefRef.current = voiceLang;
  openRef.current = open;

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, messages, busy, error, listening]);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      if (followupTimerRef.current) window.clearTimeout(followupTimerRef.current);
      if (postTtsTimerRef.current) window.clearTimeout(postTtsTimerRef.current);
      if (standbyRestartRef.current) window.clearTimeout(standbyRestartRef.current);
      listenerRef.current?.abort();
      standbyListenerRef.current?.abort();
      cloudRecRef.current?.abort();
      meterRef.current?.stop();
      speakCancelRef.current?.();
      stopSpeaking();
    };
  }, []);

  // Desktop browser-STT analyser only
  useEffect(() => {
    if (!listening || !useMeter.current || !useBrowserStt.current) {
      meterRef.current?.stop();
      meterRef.current = null;
      if (!listening) setMicLevel(0);
      return undefined;
    }

    const meter = createMicLevelMeter({
      onLevel: (level) => {
        setMicLevel((prev) =>
          Math.abs(prev - level) < 0.045 ? prev : level
        );
      },
    });
    meterRef.current = meter;
    meter.start().catch(() => setMicLevel(0));

    return () => {
      meter.stop();
      if (meterRef.current === meter) meterRef.current = null;
    };
  }, [listening]);

  function clearFollowUp() {
    if (followupTimerRef.current) {
      window.clearTimeout(followupTimerRef.current);
      followupTimerRef.current = 0;
    }
  }

  function clearPostTts() {
    if (postTtsTimerRef.current) {
      window.clearTimeout(postTtsTimerRef.current);
      postTtsTimerRef.current = 0;
    }
  }

  function sttLang() {
    return resolveVoiceLang(langPrefRef.current);
  }

  function listenLang() {
    if (phaseRef.current === "sleep") return "en-US";
    if (langPrefRef.current !== "auto") return sttLang();
    return lastDetectedRef.current || sttLang();
  }

  function armFollowUpTimer() {
    clearFollowUp();
    followupTimerRef.current = window.setTimeout(() => {
      followupTimerRef.current = 0;
      if (phaseRef.current !== "followup") return;
      if (listeningRef.current || busyRef.current || speakingRef.current) {
        armFollowUpTimer();
        return;
      }
      sleepSession();
    }, FOLLOWUP_MS);
  }

  function sleepSession({ keepPanel = true } = {}) {
    phaseRef.current = "sleep";
    voiceLoopRef.current = false;
    fromVoiceRef.current = false;
    setVoiceOn(false);
    clearFollowUp();
    clearPostTts();
    stopVoiceCapture({ abort: true });
    setInput("");
    standbyOnRef.current = false;
    stopStandby();
    setWakeHint(
      keepPanel
        ? "Sleeping. Tap the headset or mic to talk again."
        : ""
    );
  }

  function beginTurn() {
    phaseRef.current = "turn";
    voiceLoopRef.current = true;
    fromVoiceRef.current = true;
    setVoiceOn(true);
    setOpen(true);
    setWakeHint("Listening… ask your question.");
    playWakeChime();
    stopStandby();
    scheduleListenRestart(220);
  }

  function beginFollowUp() {
    phaseRef.current = "followup";
    voiceLoopRef.current = true;
    fromVoiceRef.current = true;
    setVoiceOn(true);
    setWakeHint("Your turn — I’m listening.");
    armFollowUpTimer();
    scheduleListenRestart(280);
  }

  function extendFollowUp() {
    if (phaseRef.current !== "followup") return;
    setWakeHint("Still listening…");
    armFollowUpTimer();
  }

  function stopStandby() {
    if (standbyRestartRef.current) {
      window.clearTimeout(standbyRestartRef.current);
      standbyRestartRef.current = 0;
    }
    standbyListenerRef.current?.abort();
    standbyListenerRef.current = null;
  }

  function scheduleStandbyRestart(delayMs = 400) {
    if (standbyRestartRef.current) window.clearTimeout(standbyRestartRef.current);
    standbyRestartRef.current = window.setTimeout(() => {
      standbyRestartRef.current = 0;
      if (
        standbyOnRef.current &&
        openRef.current &&
        phaseRef.current === "sleep" &&
        !voiceLoopRef.current
      ) {
        startStandby();
      }
    }, delayMs);
  }

  function onStandbyHeard(text) {
    const parsed = parseWakeUtterance(text, { armed: false });
    if (parsed.action === "ignore") {
      if (openRef.current && phaseRef.current === "sleep") {
        scheduleStandbyRestart(280);
      }
      return;
    }

    stopStandby();
    unlockSpeechAudio();
    setOpen(true);

    if (parsed.action === "arm") {
      beginTurn();
      return;
    }
    phaseRef.current = "turn";
    voiceLoopRef.current = true;
    fromVoiceRef.current = true;
    setVoiceOn(true);
    playWakeChime();
    send(parsed.command, { fromVoice: true });
  }

  function startStandby() {
    if (!voiceSupported || inAppBrowser || !preferBrowserStt()) return;
    if (!openRef.current) return;
    if (phaseRef.current !== "sleep") return;
    if (voiceLoopRef.current || listeningRef.current) return;
    if (standbyListenerRef.current) return;

    standbyOnRef.current = true;
    unlockSpeechAudio();

    const listener = createSpeechListener({
      lang: "en-US",
      preferWake: true,
      onFinal: (finalText) => {
        standbyListenerRef.current = null;
        if (finalText) onStandbyHeard(finalText);
        else scheduleStandbyRestart(280);
      },
      onError: (code) => {
        standbyListenerRef.current = null;
        if (code === "not-allowed") {
          standbyOnRef.current = false;
          return;
        }
        if (
          standbyOnRef.current &&
          openRef.current &&
          phaseRef.current === "sleep" &&
          !voiceLoopRef.current
        ) {
          scheduleStandbyRestart(code === "no-speech" ? 250 : 500);
        }
      },
      onEnd: ({ committed, stoppedByUs } = {}) => {
        standbyListenerRef.current = null;
        if (
          !committed &&
          !stoppedByUs &&
          standbyOnRef.current &&
          openRef.current &&
          phaseRef.current === "sleep" &&
          !voiceLoopRef.current
        ) {
          scheduleStandbyRestart(280);
        }
      },
    });

    if (!listener) return;
    standbyListenerRef.current = listener;
    listener.start();
  }

  function interruptReply() {
    if (chatAbortRef.current) {
      chatAbortRef.current.abort();
      chatAbortRef.current = null;
    }
    haltSpeech();
    setBusy(false);
    busyRef.current = false;
    setError("");
    lastSentAtRef.current = 0;
    setLastSentAt(0);
  }

  function handleVoiceTranscript(text) {
    const spoken = String(text || "").trim();
    if (!spoken) {
      onListenMiss();
      return;
    }

    const cut = parseInterruptUtterance(spoken);
    if (cut.action === "hold") {
      if (phaseRef.current === "followup") {
        setInput("");
        extendFollowUp();
        scheduleListenRestart(220);
      }
      return;
    }
    if (cut.action === "stop") {
      interruptReply();
      setInput("");
      sleepSession();
      return;
    }
    if (cut.action === "redirect") {
      interruptReply();
      send(cut.command, { fromVoice: true });
      return;
    }

    const inSession =
      phaseRef.current === "turn" || phaseRef.current === "followup";

    if (!inSession) {
      send(spoken, { fromVoice: true });
      return;
    }

    const parsed = parseWakeUtterance(spoken, { armed: true });
    if (parsed.action === "arm") {
      beginTurn();
      return;
    }

    clearFollowUp();
    send(parsed.action === "command" ? parsed.command : spoken, {
      fromVoice: true,
    });
  }

  function onListenMiss() {
    if (phaseRef.current === "sleep") return;
    if (busyRef.current || speakingRef.current) return;
    setWakeHint("Still listening…");
    if (phaseRef.current === "followup") extendFollowUp();
    scheduleListenRestart(350);
  }

  function clearRestartTimer() {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = 0;
    }
  }

  function scheduleListenRestart(delayMs = 450) {
    clearRestartTimer();
    const wait = isMobileVoiceClient() ? Math.max(delayMs, 550) : delayMs;
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = 0;
      if (busyRef.current || speakingRef.current) return;
      if (phaseRef.current === "sleep") return;
      if (!listeningRef.current) startListening({ loop: true });
    }, wait);
  }

  function stopVoiceCapture({ abort = false } = {}) {
    listenGenRef.current += 1;
    listeningRef.current = false;
    clearRestartTimer();
    if (abort) listenerRef.current?.abort();
    else listenerRef.current?.stop();
    listenerRef.current = null;
    if (abort) cloudRecRef.current?.abort();
    else cloudRecRef.current?.stop();
    cloudRecRef.current = null;
    setListening(false);
    setMicLevel(0);
  }

  function haltSpeech() {
    speakCancelRef.current?.();
    speakCancelRef.current = null;
    stopSpeaking();
    speakingRef.current = false;
    setSpeaking(false);
  }

  function closePanel() {
    voiceLoopRef.current = false;
    setVoiceOn(false);
    stopVoiceCapture({ abort: true });
    haltSpeech();
    if (chatAbortRef.current) {
      chatAbortRef.current.abort();
      chatAbortRef.current = null;
    }
    openRef.current = false;
    setOpen(false);
    sleepSession({ keepPanel: false });
  }

  function openPanel() {
    openRef.current = true;
    setOpen(true);
    setWakeHint(`Say “Hey ${WAKE_WORD}”, or tap the mic.`);
    startStandby();
  }

  async function send(text, { fromVoice = false } = {}) {
    const content = String(text || "").trim();
    if (!content || busyRef.current) return;

    if (!configured) {
      setError(
        "Concierge API is not connected yet. Set VITE_CONCIERGE_URL after deploying the Worker."
      );
      return;
    }

    const now = Date.now();
    if (!fromVoice && now - lastSentAtRef.current < 2500) {
      setError("Slow down a second — short cooldown to protect the demo.");
      return;
    }

    fromVoiceRef.current = fromVoice || fromVoiceRef.current;
    busyRef.current = true;
    stopVoiceCapture({ abort: true });
    haltSpeech();
    clearFollowUp();
    clearPostTts();

    if (chatAbortRef.current) {
      chatAbortRef.current.abort();
    }
    const ac = new AbortController();
    chatAbortRef.current = ac;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setWakeGuideOpen(false);
    setInput("");
    setError("");
    setBusy(true);
    lastSentAtRef.current = now;
    setLastSentAt(now);
    setWakeHint("Thinking…");

    try {
      const detected = detectLangFromText(content);
      const replyLangId = inferReplyLang(content, langPrefRef.current);
      if (langPrefRef.current !== "auto") lastDetectedRef.current = replyLangId;
      else if (detected) lastDetectedRef.current = detected;
      const { reply } = await askConcierge(next, {
        signal: ac.signal,
        language: languageDisplayName(replyLangId),
      });
      if (ac.signal.aborted) return;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      const useVoice = fromVoiceRef.current && canUseVoiceOutput();
      if (useVoice) {
        const spoken = stripMarkdown(reply);
        const fromReply = detectLangFromText(spoken);
        const ttsLang =
          langPrefRef.current !== "auto"
            ? resolveVoiceLang(langPrefRef.current, spoken)
            : fromReply || lastDetectedRef.current || resolveVoiceLang("auto", spoken);
        speakingRef.current = true;
        setSpeaking(true);
        setWakeHint("Speaking… tap ■ to stop");
        speakCancelRef.current = speakText(spoken, {
          lang: ttsLang,
          onEnd: () => {
            speakingRef.current = false;
            setSpeaking(false);
            speakCancelRef.current = null;
            if (!fromVoiceRef.current) {
              sleepSession();
              return;
            }
            if (postTtsTimerRef.current) window.clearTimeout(postTtsTimerRef.current);
            postTtsTimerRef.current = window.setTimeout(() => {
              postTtsTimerRef.current = 0;
              if (fromVoiceRef.current && phaseRef.current !== "sleep") {
                beginFollowUp();
              }
            }, POST_TTS_LISTEN_MS);
          },
        });
      } else if (fromVoiceRef.current) {
        beginFollowUp();
      }
    } catch (err) {
      if (err?.name === "AbortError" || /abort/i.test(String(err?.message || ""))) {
        return;
      }
      setError(err?.message || "Something went wrong");
      sleepSession();
    } finally {
      if (chatAbortRef.current === ac) {
        chatAbortRef.current = null;
        busyRef.current = false;
        setBusy(false);
      }
    }
  }

  async function startCloudListening({ loop = false } = {}) {
    if (!canUseCloudSttCapture()) {
      setError(
        "This browser can’t record audio. Type your question, or try Chrome / Edge / Firefox / Safari."
      );
      return;
    }

    listeningRef.current = true;
    setListening(true);
    setError("");

    try {
      const rec = await startCloudUtterance({
        maxMs: phaseRef.current === "followup" ? 16000 : 12000,
        silenceMs: isMobileVoiceClient() ? 3200 : 2800,
        minMs: 1800,
        onLevel: (level) => {
          if (level > 0.12 && phaseRef.current === "followup") extendFollowUp();
          setMicLevel((prev) =>
            Math.abs(prev - level) < 0.045 ? prev : level
          );
        },
      });
      cloudRecRef.current = rec;

      const blob = await rec.done;
      cloudRecRef.current = null;
      listeningRef.current = false;
      setListening(false);
      setMicLevel(0);

      if (!blob?.size || blob.size < 800) {
        onListenMiss();
        return;
      }

      setInput("Transcribing…");
      const { text } = await transcribeAudio(blob);
      setInput(text);
      if (text) handleVoiceTranscript(text);
      else onListenMiss();
    } catch (err) {
      cloudRecRef.current = null;
      listeningRef.current = false;
      setListening(false);
      setMicLevel(0);
      const msg = String(err?.message || err || "");
      if (msg === "aborted") return;
      if (/notallowed|permission|denied/i.test(msg)) {
        setError(
          inAppBrowser
            ? inAppVoiceHint()
            : "Microphone permission blocked — allow mic access to talk."
        );
        voiceLoopRef.current = false;
        setVoiceOn(false);
        return;
      }
      setError(msg || "Couldn’t catch that — try again or type your question.");
      onListenMiss();
    }
  }

  async function startBrowserListening({ loop = false } = {}) {
    listeningRef.current = true;
    try {
      if (isMobileVoiceClient()) {
        await ensureMicPermission();
      }
    } catch {
      listeningRef.current = false;
      setError(
        inAppBrowser
          ? inAppVoiceHint()
          : "Microphone permission blocked — allow mic access to talk."
      );
      voiceLoopRef.current = false;
      setVoiceOn(false);
      return;
    }

    const gen = listenGenRef.current;
    const listener = createSpeechListener({
      lang: listenLang(),
      continuous:
        phaseRef.current === "turn" || phaseRef.current === "followup",
      settleMs: isMobileVoiceClient() ? 1400 : 1100,
      onPartial: (partial) => {
        if (gen !== listenGenRef.current) return;
        setInput(partial);
        if (String(partial || "").trim()) extendFollowUp();
      },
      onFinal: (finalText) => {
        if (gen !== listenGenRef.current) return;
        setInput(finalText);
        stopVoiceCapture({ abort: true });
        if (finalText) handleVoiceTranscript(finalText);
      },
      onActivity: (active) => {
        if (gen !== listenGenRef.current) return;
        if (useMeter.current) return;
        setMicLevel(active ? 0.72 : 0);
      },
      onError: (code) => {
        if (gen !== listenGenRef.current) return;
        if (code === "aborted") return;

        listeningRef.current = false;
        setListening(false);
        listenerRef.current = null;
        setMicLevel(0);

        if (code === "not-allowed") {
          setError(
            inAppBrowser
              ? inAppVoiceHint()
              : "Microphone permission blocked — allow mic access to talk."
          );
          voiceLoopRef.current = false;
          setVoiceOn(false);
          return;
        }

        if (code === "network") {
          if (canUseCloudSttCapture()) {
            startCloudListening({ loop: loop || voiceLoopRef.current });
            return;
          }
          setError(
            "Speech service needs network. Check connectivity or type your question."
          );
          if (phaseRef.current !== "sleep") scheduleListenRestart(1200);
          return;
        }

        onListenMiss();
      },
      onEnd: ({ committed, stoppedByUs } = {}) => {
        if (gen !== listenGenRef.current) return;
        listeningRef.current = false;
        setListening(false);
        listenerRef.current = null;
        setMicLevel(0);
        if (!committed && !stoppedByUs) onListenMiss();
      },
    });

    if (!listener) {
      startCloudListening({ loop });
      return;
    }

    if (gen !== listenGenRef.current) return;
    listenerRef.current = listener;
    listeningRef.current = true;
    setListening(true);
    listener.start();
  }

  async function startListening({ loop = false } = {}) {
    if (!voiceSupported || listeningRef.current) return;
    if (busyRef.current || speakingRef.current) return;
    if (phaseRef.current === "sleep" && !loop) {
      /* one-shot mic tap */
    } else if (phaseRef.current === "sleep") {
      return;
    }

    stopStandby();
    setError("");
    clearRestartTimer();

    if (useBrowserStt.current) {
      await startBrowserListening({ loop });
      return;
    }
    if (!sttLang().startsWith("en")) {
      setError(
        "This language needs Chrome or Safari speech. Switch Voice to English, or type your question."
      );
      return;
    }
    await startCloudListening({ loop });
  }

  function toggleMic() {
    if (listening) {
      stopVoiceCapture({ abort: true });
      return;
    }
    unlockSpeechAudio();
    fromVoiceRef.current = true;
    startListening({ loop: false });
  }

  function toggleVoiceMode() {
    if (voiceOn || phaseRef.current !== "sleep") {
      interruptReply();
      sleepSession();
      return;
    }
    if (!voiceSupported) {
      setError(
        "Voice needs mic access in Chrome, Edge, Firefox, or Safari."
      );
      return;
    }
    unlockSpeechAudio();
    beginTurn();
  }

  /** Square stop — cut the reply and sleep. */
  function stopAllVoice() {
    interruptReply();
    sleepSession();
  }

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="concierge-root">
      {open ? (
        <section
          className="concierge-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
        >
          <header className="concierge-header">
            <div>
              <p className="section-label">// Live demo</p>
              <h2 id={titleId}>Portfolio Concierge</h2>
            </div>
            <div className="concierge-header-tools">
              <LangPicker
                value={voiceLang}
                onChange={(next) => {
                  setVoiceLang(next);
                  try {
                    localStorage.setItem(LANG_KEY, next);
                  } catch {
                    /* ignore */
                  }
                  if (listeningRef.current) {
                    stopVoiceCapture({ abort: true });
                    startListening({ loop: voiceLoopRef.current });
                  }
                }}
              />
              <button
                type="button"
                className="concierge-icon-btn"
                aria-label="Close concierge"
                onClick={closePanel}
              >
                ×
              </button>
            </div>
          </header>

          {messages.length === 0 ? (
            <>
              <p className="concierge-lede">{WELCOME}</p>
              <p className="concierge-wake-hint">
                <span className="section-label">// Voice</span>
                {VOICE_HINT}
              </p>
            </>
          ) : (
            <div className="concierge-wake-fold">
              <button
                type="button"
                className={
                  wakeGuideOpen
                    ? "concierge-wake-toggle is-open"
                    : "concierge-wake-toggle"
                }
                aria-expanded={wakeGuideOpen}
                onClick={() => setWakeGuideOpen((v) => !v)}
              >
                <span className="section-label">// How to use</span>
                <span className="concierge-wake-arrow" aria-hidden="true">
                  ▸
                </span>
              </button>
              {wakeGuideOpen ? (
                <p className="concierge-wake-hint">{VOICE_HINT}</p>
              ) : null}
            </div>
          )}

          {inAppBrowser ? (
            <p className="concierge-browser-hint">
              Voice needs Safari/Chrome — LinkedIn’s in-app view often blocks the
              mic. Use{" "}
              <strong>⋯ → Open in browser</strong>, or{" "}
              <a href={EXTERNAL_BROWSER_URL} rel="noreferrer">
                open here
              </a>
              . Text chat works either way.
            </p>
          ) : null}

          <div className="concierge-suggestions" aria-label="Suggested questions">
            {messages.length === 0
              ? SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="concierge-chip"
                    disabled={busy}
                    onClick={() => send(q)}
                  >
                    {q}
                  </button>
                ))
              : null}
          </div>

          <div className="concierge-thread" ref={listRef} aria-live="polite">
            {messages.length === 0 ? (
              !configured ? (
                <p className="concierge-empty">
                  <span className="concierge-warn">
                    Endpoint not set ({getConciergeUrl() || "missing"}).
                  </span>
                </p>
              ) : null
            ) : (
              messages.map((m, i) => (
                <MessageBubble
                  key={`${m.role}-${i}`}
                  role={m.role}
                  content={m.content}
                />
              ))
            )}
            {busy ? (
              <p className="concierge-typing" aria-hidden="true">
                Thinking…
              </p>
            ) : null}
            {error ? <p className="concierge-error">{error}</p> : null}
          </div>

          <div className="concierge-composer">
            {(listening || speaking || voiceOn) && (
              <div className="concierge-status-row">
                <p className="concierge-status" aria-live="polite">
                  {listening
                    ? wakeHint || "Listening…"
                    : speaking
                      ? "Speaking… tap ■ to stop"
                      : wakeHint || `Say “Hey ${WAKE_WORD}”`}
                </p>
                <button
                  type="button"
                  className="concierge-stop-btn"
                  onClick={stopAllVoice}
                  aria-label="Stop voice and listening"
                  title="Stop"
                >
                  <IconStop />
                </button>
              </div>
            )}

            <form className="concierge-form" onSubmit={onSubmit}>
              <button
                type="button"
                className={
                  voiceOn
                    ? "concierge-icon-ctl is-active is-voice-on"
                    : "concierge-icon-ctl"
                }
                disabled={busy && !voiceOn}
                onClick={toggleVoiceMode}
                aria-pressed={voiceOn}
                aria-label={
                  voiceOn
                    ? "Turn off voice conversation"
                    : "Start voice conversation"
                }
                title={
                  voiceOn
                    ? "End this voice turn"
                    : `Start a voice turn (or say Hey ${WAKE_WORD})`
                }
              >
                {voiceOn ? (
                  <VoiceWaveIcon level={micLevel} speakingOut={speaking} />
                ) : (
                  <IconHeadset />
                )}
              </button>

              <label className="sr-only" htmlFor="concierge-input">
                Ask the concierge
              </label>
              <input
                id="concierge-input"
                ref={inputRef}
                type="text"
                value={input}
                maxLength={800}
                disabled={busy}
                placeholder={
                  listening
                    ? "Listening…"
                    : speaking
                      ? "Concierge is speaking…"
                      : "Ask about Sprouts, projects, thesis…"
                }
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
              />

              <button
                type="button"
                className={
                  listening
                    ? "concierge-icon-ctl is-listening"
                    : "concierge-icon-ctl"
                }
                disabled={!voiceSupported || busy}
                onClick={toggleMic}
                aria-pressed={listening}
                aria-label={listening ? "Stop microphone" : "Use microphone"}
                title={
                  voiceSupported
                    ? listening
                      ? "Stop listening"
                      : "Ask with microphone"
                    : "Voice input not supported here"
                }
              >
                <IconMic />
              </button>

              <button
                type="submit"
                className="btn-primary concierge-send"
                disabled={busy || !input.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className={open ? "concierge-fab is-open" : "concierge-fab"}
        aria-expanded={open}
        onClick={() => {
          if (open) closePanel();
          else openPanel();
        }}
      >
        {open ? "Close" : "Ask AI"}
      </button>
    </div>
  );
}
