import React, { useEffect, useMemo, useRef, useState } from "react";
import BunnyAvatar from "./BunnyAvatar";
import InteractiveBackground from "./InteractiveBackground";
import { useApp } from "../lib/state";
import { AudioStreamer } from "../lib/audio";
import { LiveSession } from "../lib/liveSession";
import { TTSSession } from "../lib/tts";
import { createSession, saveMessage } from "../lib/supabase";
import { dedupTranscript } from "../lib/utils";

/**
 * Assistant View — voice-first.
 *
 * Two modes share the same avatar, mic button and Supabase logger:
 *   - live : Gemini Live API, real-time audio-in / audio-out
 *   - tts  : browser SpeechRecognition -> Gemini text -> Gemini TTS
 *
 * State machine: disconnected -> connecting -> listening -> speaking -> idle.
 */
export default function AssistantView() {
  const {
    voiceMode,
    sassiness,
    connState,
    setConnState,
    micLevel,
    setMicLevel,
    speakerLevel,
    setSpeakerLevel,
    tone,
    setToneFromText,
    sessionId,
    setSessionId,
    setToast,
    activeKey,
  } = useApp();

  const audioRef = useRef<AudioStreamer | null>(null);
  const liveRef = useRef<LiveSession | null>(null);
  const ttsRef = useRef<TTSSession | null>(null);

  const userBuf = useRef<string>("");
  const assistantBuf = useRef<string>("");
  const lastUserSaved = useRef<string>("");
  const lastAssistantSaved = useRef<string>("");

  const speakerTick = useRef<number | null>(null);

  const [, force] = useState(0);
  const [interimUser, setInterimUser] = useState("");
  const [interimAssistant, setInterimAssistant] = useState("");

  // New chat session in Supabase per app open
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await createSession(`Atharv Sir · ${new Date().toLocaleString()}`);
      if (!cancelled && s) setSessionId(s.id);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSpeakerDecay = () => {
    if (speakerTick.current) cancelAnimationFrame(speakerTick.current);
    const tick = () => {
      setSpeakerLevel((v: number) => Math.max(0, v * 0.86));
      speakerTick.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const ensureAudio = () => {
    if (!audioRef.current) audioRef.current = new AudioStreamer();
    return audioRef.current;
  };

  const start = async () => {
    try {
      const audio = ensureAudio();
      const key = activeKey();
      if (!key) {
        setToast("Add a Gemini API key in Settings first.");
        return;
      }

      if (voiceMode === "live") {
        const session = new LiveSession(key, audio, {
          onState: (s) => {
            setConnState(s === "disconnected" ? "idle" : s);
            if (s === "speaking") startSpeakerDecay();
          },
          onUserTranscript: (t, final) => {
            userBuf.current = dedupTranscript(userBuf.current, t);
            if (final) {
              const text = userBuf.current.trim();
              if (text && text !== lastUserSaved.current && sessionId) {
                saveMessage(sessionId, "user", text);
                lastUserSaved.current = text;
              }
              setInterimUser("");
            } else {
              setInterimUser(userBuf.current + " …");
            }
            force((n) => n + 1);
          },
          onModelTranscript: (t, final) => {
            assistantBuf.current = dedupTranscript(assistantBuf.current, t);
            if (final) {
              const text = assistantBuf.current.trim();
              if (text && text !== lastAssistantSaved.current) {
                if (sessionId) saveMessage(sessionId, "assistant", text);
                lastAssistantSaved.current = text;
                setToneFromText(text);
              }
              setInterimAssistant("");
            } else {
              setInterimAssistant(assistantBuf.current + " …");
            }
            force((n) => n + 1);
          },
          onToolCall: async (name, args) => {
            if (name === "openWebsite") {
              try {
                const url: string = args?.url || "";
                const desc: string = args?.description || "";
                if (url) window.open(url, "_blank", "noopener,noreferrer");
                return { ok: true, opened: url, note: desc };
              } catch (e: any) {
                return { ok: false, error: String(e?.message || e) };
              }
            }
            if (name === "closeTab") {
              try {
                window.close();
                return { ok: true, note: "Attempted to close the tab." };
              } catch (e: any) {
                return { ok: false, error: String(e?.message || e) };
              }
            }
            if (name === "playYouTubeVideo") {
              try {
                const q: string = args?.searchQuery || "";
                if (q) window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");
                return { ok: true, played: q };
              } catch (e: any) {
                return { ok: false, error: String(e?.message || e) };
              }
            }
            return { ok: false, error: "unknown tool" };
          },
          onError: (e) => setToast(e),
        });
        liveRef.current = session;
        await session.connect(sassiness);
      } else {
        const tts = new TTSSession({
          apiKey: key,
          audio,
          sassiness,
          voice: "Kore",
          onAssistantText: (txt) => {
            assistantBuf.current = dedupTranscript(assistantBuf.current, txt);
            if (sessionId && txt !== lastAssistantSaved.current) {
               saveMessage(sessionId, "assistant", txt);
               lastAssistantSaved.current = txt;
            }
            setToneFromText(txt);
            setInterimAssistant(txt);
            force((n) => n + 1);
          },
        });
        ttsRef.current = tts;
        tts.start();
        setConnState("listening");
      }
    } catch (e: any) {
      setToast(e?.message || "Failed to start");
      setConnState("disconnected");
    }
  };

  const stop = async () => {
    try {
      await liveRef.current?.disconnect();
    } catch {}
    try {
      ttsRef.current?.stop();
    } catch {}
    audioRef.current?.stopMic();
    audioRef.current?.stopPlayback();
    audioRef.current = null;
    liveRef.current = null;
    ttsRef.current = null;
    setConnState("disconnected");
  };

  useEffect(() => {
    return () => {
      liveRef.current?.disconnect().catch(() => {});
      ttsRef.current?.stop();
      audioRef.current?.stop();
    };
  }, []);

  const onMicClick = () => {
    if (connState === "disconnected" || connState === "idle") start();
    else stop();
  };

  const background = useMemo(() => {
    const sassBoost = sassiness === "extreme" ? 1.15 : sassiness === "balanced" ? 1.0 : 0.9;
    const t =
      tone === "warm"
        ? ["#3b0f4d", "#7a1d72", "#ff5ec4"]
        : tone === "playful"
        ? ["#0d2b6b", "#3aa8ff", "#b76bff"]
        : tone === "sassy"
        ? ["#5b0a2a", "#ff3a8a", "#ff8b3a"]
        : ["#0b1d4a", "#3a1d8a", "#1f8a8a"];
    const a = t[0];
    const b = t[1];
    const c = t[2];
    const intensity = 0.6 * sassBoost;
    return {
      background: `radial-gradient(ellipse at top, ${b}55, transparent 60%), radial-gradient(ellipse at bottom, ${c}55, transparent 60%), linear-gradient(180deg, ${a}, #060114 ${60 * intensity}%)`,
    };
  }, [tone, sassiness]);

  const isLive = connState === "listening" || connState === "speaking" || connState === "connecting";

  return (
    <div className="relative h-full w-full transition-all duration-700" style={background}>
      {/* Interactive Animated Background */}
      <div className="absolute inset-0 z-0">
        <InteractiveBackground tone={tone} sassiness={sassiness} />
      </div>

      <div className="relative z-10 h-full w-full flex flex-col items-center px-4 pb-28 pt-6">
        {/* Avatar */}
        <BunnyAvatar state={connState} speakerLevel={speakerLevel} micLevel={micLevel} />

        {/* Transcript strip */}
        <div className="mt-4 w-full max-w-xl space-y-2 text-center">
          {interimAssistant && (
            <div className="glass-strong rounded-2xl px-4 py-2 text-sm leading-relaxed animate-floaty">
              <span className="text-[10px] uppercase tracking-widest text-bunny-pink mr-2">Bunny</span>
              {interimAssistant}
            </div>
          )}
          {interimUser && (
            <div className="glass rounded-2xl px-4 py-2 text-xs leading-relaxed text-white/80">
              <span className="text-[10px] uppercase tracking-widest text-bunny-blue mr-2">You</span>
              {interimUser}
            </div>
          )}
          {!interimAssistant && !interimUser && connState === "disconnected" && (
            <div className="text-white/50 text-sm">
              {voiceMode === "live"
                ? "Tap the mic. I'm listening with my whole heart, Sir."
                : "Tap the mic. I'll listen through your browser, Sir."}
            </div>
          )}
          {connState === "connecting" && (
            <div className="text-bunny-pink text-sm animate-pulse">Connecting to Gemini Live, Sir…</div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="fixed inset-x-0 bottom-6 flex justify-center z-30">
        <div className="glass-strong neon-border rounded-full px-5 py-3 flex items-center gap-4 shadow-glow">
          <button
            onClick={onMicClick}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
              isLive
                ? "bg-gradient-to-br from-bunny-pink to-bunny-violet shadow-glow"
                : "bg-white/10 hover:bg-white/20 border border-white/15"
            }`}
            aria-label={isLive ? "Stop listening" : "Start listening"}
          >
            {isLive && (
              <span className="absolute inset-0 rounded-full border border-bunny-pink/60 animate-pulseRing" />
            )}
            {connState === "speaking" ? "🔊" : connState === "listening" ? "🎙️" : "🎤"}
          </button>
          <div className="flex flex-col text-xs leading-tight">
            <span className="uppercase tracking-widest text-white/50">
              {voiceMode === "live" ? "LIVE" : "TTS"} · {sassiness}
            </span>
            <span className="font-display text-sm">
              {connState === "speaking"
                ? "Speaking…"
                : connState === "listening"
                ? "Listening…"
                : connState === "connecting"
                ? "Connecting…"
                : "Idle"}
            </span>
          </div>
          <div className="flex items-end gap-0.5 h-7 w-12">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-bunny-pink animate-wave"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  transform: `scaleY(${0.3 + Math.min(1, Math.max(micLevel, speakerLevel) * 2)})`,
                  height: "100%",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}