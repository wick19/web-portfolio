import { useEffect, useId, useRef, useState } from "react";
import {
  askConcierge,
  getConciergeUrl,
  isConciergeConfigured,
} from "../../lib/conciergeApi";
import {
  canUseVoiceInput,
  canUseVoiceOutput,
  createMicLevelMeter,
  createSpeechListener,
  speakText,
  stopSpeaking,
} from "../../lib/voice";
import VoiceWaveIcon from "./VoiceWaveIcon";

const SUGGESTIONS = [
  "What does Ritwik ship at Sprouts.ai?",
  "Summarize his strongest AI / ML proof",
  "Where should I start on this site?",
];

const WELCOME =
  "Ask about Ritwik’s experience, projects, thesis, or how to reach him. For the full picture, please go through the website — Home, Projects, Thesis, Experience, and Contact.";

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
  const speakCancelRef = useRef(null);
  const voiceLoopRef = useRef(false);
  const meterRef = useRef(null);

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
  const [voiceSupported] = useState(() => canUseVoiceInput());
  const configured = isConciergeConfigured();

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, messages, busy, error, listening]);

  useEffect(() => {
    return () => {
      listenerRef.current?.abort();
      meterRef.current?.stop();
      speakCancelRef.current?.();
      stopSpeaking();
    };
  }, []);

  // Drive wave from real mic amplitude only while capturing
  useEffect(() => {
    if (!listening) {
      meterRef.current?.stop();
      meterRef.current = null;
      setMicLevel(0);
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
    meter.start().catch(() => {
      setMicLevel(0);
    });

    return () => {
      meter.stop();
      if (meterRef.current === meter) meterRef.current = null;
    };
  }, [listening]);

  function stopVoiceCapture() {
    listenerRef.current?.stop();
    listenerRef.current = null;
    setListening(false);
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
    stopVoiceCapture();
    haltSpeech();
    setOpen(false);
  }

  async function send(text, { fromVoice = false } = {}) {
    const content = String(text || "").trim();
    if (!content || busy) return;

    if (!configured) {
      setError(
        "Concierge API is not connected yet. Set VITE_CONCIERGE_URL after deploying the Worker."
      );
      return;
    }

    const now = Date.now();
    if (now - lastSentAt < 2500) {
      setError("Slow down a second — short cooldown to protect the demo.");
      return;
    }

    stopVoiceCapture();
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
            if (voiceLoopRef.current) {
              window.setTimeout(() => startListening({ loop: true }), 350);
            }
          },
        });
      }
    } catch (err) {
      setError(err?.message || "Something went wrong");
      voiceLoopRef.current = false;
      setVoiceOn(false);
    } finally {
      setBusy(false);
    }
  }

  function startListening({ loop = false } = {}) {
    if (!voiceSupported || busy || listening) return;

    haltSpeech();
    setError("");

    const listener = createSpeechListener({
      onPartial: (partial) => setInput(partial),
      onFinal: (finalText) => {
        setInput(finalText);
        stopVoiceCapture();
        if (finalText) send(finalText, { fromVoice: true });
      },
      onError: (code) => {
        setListening(false);
        listenerRef.current = null;
        if (code === "not-allowed") {
          setError("Microphone permission blocked — allow mic access to talk.");
        } else if (code !== "aborted" && code !== "no-speech") {
          setError("Couldn’t catch that — try again or type your question.");
        }
        if (loop) {
          voiceLoopRef.current = false;
          setVoiceOn(false);
        }
      },
      onEnd: () => {
        setListening(false);
        listenerRef.current = null;
      },
    });

    if (!listener) {
      setError("Voice input isn’t supported in this browser. Try Chrome.");
      return;
    }

    listenerRef.current = listener;
    setListening(true);
    listener.start();
  }

  function toggleMic() {
    if (listening) {
      stopVoiceCapture();
      return;
    }
    startListening({ loop: voiceLoopRef.current });
  }

  function toggleVoiceMode() {
    if (voiceOn) {
      voiceLoopRef.current = false;
      setVoiceOn(false);
      stopVoiceCapture();
      haltSpeech();
      return;
    }
    if (!voiceSupported) {
      setError("Voice mode needs Chrome/Edge (or Safari with speech support).");
      return;
    }
    voiceLoopRef.current = true;
    setVoiceOn(true);
    startListening({ loop: true });
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
              <p className="concierge-status" aria-live="polite">
                {listening
                  ? "Listening…"
                  : speaking
                    ? "Speaking…"
                    : "Voice mode on"}
              </p>
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
                  <VoiceWaveIcon
                    level={micLevel}
                    speakingOut={speaking}
                  />
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
