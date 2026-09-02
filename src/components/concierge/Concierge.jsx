import { useEffect, useId, useRef, useState } from "react";
import {
  askConcierge,
  getConciergeUrl,
  isConciergeConfigured,
  transcribeAudio,
} from "../../lib/conciergeApi";
import {
  canUseAnyVoiceInput,
  canUseCloudSttCapture,
  canUseVoiceOutput,
  createMicLevelMeter,
  createSpeechListener,
  ensureMicPermission,
  getExternalBrowserUrl,
  isInAppBrowser,
  isMobileVoiceClient,
  preferBrowserStt,
  shouldUseMicMeter,
  speakText,
  startCloudUtterance,
  stopSpeaking,
  unlockSpeechAudio,
} from "../../lib/voice";
import VoiceWaveIcon from "./VoiceWaveIcon";

const SUGGESTIONS = [
  "What does Ritwik ship at Sprouts.ai?",
  "Summarize his strongest AI / ML proof",
  "Where should I start on this site?",
];

const WELCOME =
  "Ask about Ritwik’s experience, projects, thesis, or how to reach him — by text or voice. For the full picture, also browse Home, Projects, Thesis, Experience, and Contact.";

const PORTFOLIO_URL = "https://wick19.github.io/web-portfolio/";
const EXTERNAL_BROWSER_URL = getExternalBrowserUrl(PORTFOLIO_URL);
const SOFT_SPEECH_ERRORS = new Set(["no-speech", "aborted"]);

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

function MessageBubble({ role, content }) {
  return (
    <div
      className={
        role === "user" ? "concierge-msg concierge-msg-user" : "concierge-msg"
      }
    >
      <p>{content}</p>
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
  const restartTimerRef = useRef(0);
  const useMeter = useRef(shouldUseMicMeter());
  const useBrowserStt = useRef(preferBrowserStt());

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
  const [voiceSupported] = useState(() => canUseAnyVoiceInput());
  const [inAppBrowser] = useState(() => isInAppBrowser());
  const configured = isConciergeConfigured();

  busyRef.current = busy;
  listeningRef.current = listening;

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, messages, busy, error, listening]);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      listenerRef.current?.abort();
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
      if (
        voiceLoopRef.current &&
        !busyRef.current &&
        !listeningRef.current
      ) {
        startListening({ loop: true });
      }
    }, wait);
  }

  function stopVoiceCapture({ abort = false } = {}) {
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
    setSpeaking(false);
  }

  function closePanel() {
    voiceLoopRef.current = false;
    setVoiceOn(false);
    stopVoiceCapture({ abort: true });
    haltSpeech();
    setOpen(false);
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
    if (now - lastSentAt < 2500) {
      setError("Slow down a second — short cooldown to protect the demo.");
      if (voiceLoopRef.current) scheduleListenRestart(800);
      return;
    }

    stopVoiceCapture({ abort: true });
    haltSpeech();

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    setLastSentAt(now);

    try {
      const { reply } = await askConcierge(next);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if ((fromVoice || voiceLoopRef.current) && canUseVoiceOutput()) {
        setSpeaking(true);
        speakCancelRef.current = speakText(reply, {
          onEnd: () => {
            setSpeaking(false);
            speakCancelRef.current = null;
            if (voiceLoopRef.current) scheduleListenRestart(400);
          },
        });
      } else if (voiceLoopRef.current) {
        scheduleListenRestart(400);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong");
      voiceLoopRef.current = false;
      setVoiceOn(false);
    } finally {
      setBusy(false);
    }
  }

  async function startCloudListening({ loop = false } = {}) {
    if (!canUseCloudSttCapture()) {
      setError(
        "This browser can’t record audio. Type your question, or try Chrome / Edge / Firefox / Safari."
      );
      return;
    }

    setListening(true);
    setError("");

    try {
      const rec = await startCloudUtterance({
        maxMs: 8000,
        silenceMs: isMobileVoiceClient() ? 2000 : 1800,
        minMs: 2200,
        onLevel: (level) => {
          setMicLevel((prev) =>
            Math.abs(prev - level) < 0.045 ? prev : level
          );
        },
      });
      cloudRecRef.current = rec;

      const blob = await rec.done;
      cloudRecRef.current = null;
      setListening(false);
      setMicLevel(0);

      if (!blob?.size || blob.size < 800) {
        if (loop || voiceLoopRef.current) scheduleListenRestart(600);
        return;
      }

      setInput("Transcribing…");
      const { text } = await transcribeAudio(blob);
      setInput(text);
      if (text) await send(text, { fromVoice: true });
      else if (loop || voiceLoopRef.current) scheduleListenRestart(500);
    } catch (err) {
      cloudRecRef.current = null;
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
      if (loop || voiceLoopRef.current) scheduleListenRestart(900);
    }
  }

  async function startBrowserListening({ loop = false } = {}) {
    try {
      if (isMobileVoiceClient()) {
        await ensureMicPermission();
      }
    } catch {
      setError(
        inAppBrowser
          ? inAppVoiceHint()
          : "Microphone permission blocked — allow mic access to talk."
      );
      voiceLoopRef.current = false;
      setVoiceOn(false);
      return;
    }

    const listener = createSpeechListener({
      onPartial: (partial) => setInput(partial),
      onFinal: (finalText) => {
        setInput(finalText);
        stopVoiceCapture({ abort: true });
        if (finalText) send(finalText, { fromVoice: true });
      },
      onActivity: (active) => {
        if (useMeter.current) return;
        setMicLevel(active ? 0.72 : 0);
      },
      onError: (code) => {
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
          // Fall back to cloud Whisper when Google speech network fails
          if (canUseCloudSttCapture()) {
            startCloudListening({ loop: loop || voiceLoopRef.current });
            return;
          }
          setError(
            "Speech service needs network. Check connectivity or type your question."
          );
          if (loop || voiceLoopRef.current) scheduleListenRestart(1200);
          return;
        }

        if (SOFT_SPEECH_ERRORS.has(code)) {
          if (loop || voiceLoopRef.current) scheduleListenRestart(500);
          return;
        }

        setError("Couldn’t catch that — try again or type your question.");
        if (loop || voiceLoopRef.current) scheduleListenRestart(700);
      },
      onEnd: ({ committed, stoppedByUs } = {}) => {
        setListening(false);
        listenerRef.current = null;
        setMicLevel(0);
        if (
          !committed &&
          !stoppedByUs &&
          voiceLoopRef.current &&
          !busyRef.current
        ) {
          scheduleListenRestart(500);
        }
      },
    });

    if (!listener) {
      startCloudListening({ loop });
      return;
    }

    listenerRef.current = listener;
    setListening(true);
    listener.start();
  }

  async function startListening({ loop = false } = {}) {
    if (!voiceSupported || busyRef.current || listeningRef.current) return;

    haltSpeech();
    setError("");
    clearRestartTimer();

    if (useBrowserStt.current) {
      await startBrowserListening({ loop });
    } else {
      await startCloudListening({ loop });
    }
  }

  function toggleMic() {
    if (listening) {
      stopVoiceCapture({ abort: true });
      return;
    }
    unlockSpeechAudio();
    startListening({ loop: voiceLoopRef.current });
  }

  function toggleVoiceMode() {
    if (voiceOn) {
      voiceLoopRef.current = false;
      setVoiceOn(false);
      stopVoiceCapture({ abort: true });
      haltSpeech();
      return;
    }
    if (!voiceSupported) {
      setError(
        "Voice needs mic access in Chrome, Edge, Firefox, or Safari."
      );
      return;
    }
    unlockSpeechAudio();
    voiceLoopRef.current = true;
    setVoiceOn(true);
    startListening({ loop: true });
  }

  /** Explicit Stop — ends voice mode, mic capture, and TTS. */
  function stopAllVoice() {
    voiceLoopRef.current = false;
    setVoiceOn(false);
    stopVoiceCapture({ abort: true });
    haltSpeech();
    if (input === "Transcribing…" || input === "Listening…") {
      setInput("");
    }
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
            <button
              type="button"
              className="concierge-icon-btn"
              aria-label="Close concierge"
              onClick={closePanel}
            >
              ×
            </button>
          </header>

          <p className="concierge-lede">{WELCOME}</p>

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
              <p className="concierge-empty">
                Start a quick conversation about Ritwik — type, tap the mic, or
                turn on Voice for a back-and-forth talk.
                {!configured ? (
                  <>
                    {" "}
                    <span className="concierge-warn">
                      Endpoint not set ({getConciergeUrl() || "missing"}).
                    </span>
                  </>
                ) : null}
              </p>
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
                    ? "Listening…"
                    : speaking
                      ? "Speaking…"
                      : "Voice mode on"}
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
                    ? "Voice conversation on"
                    : "Hands-free voice conversation"
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
        onClick={() => (open ? closePanel() : setOpen(true))}
      >
        {open ? "Close" : "Ask AI"}
      </button>
    </div>
  );
}
