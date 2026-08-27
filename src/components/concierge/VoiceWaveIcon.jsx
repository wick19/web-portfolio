/**
 * Equalizer bars for Concierge talk mode.
 * Idle = static silhouette; moves only with real mic level or TTS output.
 */
const IDLE_SHAPE = [0.32, 0.52, 0.82, 0.52, 0.32];
const LIVE_SHAPE = [0.4, 0.68, 1, 0.68, 0.4];

export default function VoiceWaveIcon({
  level = 0,
  speakingOut = false,
  className = "",
}) {
  const liveMic = level > 0.05;
  const live = liveMic || speakingOut;

  return (
    <span
      className={[
        "voice-wave",
        live ? "is-live" : "is-idle",
        speakingOut && !liveMic ? "is-tts" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {IDLE_SHAPE.map((idle, i) => {
        const scale = liveMic
          ? Math.max(0.18, LIVE_SHAPE[i] * (0.25 + level * 0.9))
          : idle;
        return (
          <span
            key={i}
            className="voice-wave__bar"
            style={{
              "--bar-i": i,
              transform: speakingOut && !liveMic ? undefined : `scaleY(${scale})`,
            }}
          />
        );
      })}
    </span>
  );
}
