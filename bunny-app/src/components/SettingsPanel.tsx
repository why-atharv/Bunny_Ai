import React from "react";
import { useApp } from "../lib/state";

export default function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { voiceMode, setVoiceMode, sassiness, setSassiness, keys, activeKeyIndex, setActiveKeyIndex, lock } = useApp();

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-strong neon-border w-full max-w-md rounded-3xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg glow-text">Settings</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Voice Mode</div>
          <div className="grid grid-cols-2 gap-2">
            {(["live", "tts"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setVoiceMode(m)}
                className={`btn ${voiceMode === m ? "btn-primary" : "btn-ghost"}`}
              >
                {m === "live" ? "Live (Gemini 3.1)" : "TTS (Speech Rec)"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Sassiness</div>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "balanced", "extreme"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSassiness(s)}
                className={`btn ${sassiness === s ? "btn-primary" : "btn-ghost"} capitalize`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {keys.length > 1 && (
          <div>
            <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Active Key</div>
            <select
              value={activeKeyIndex}
              onChange={(e) => setActiveKeyIndex(parseInt(e.target.value, 10))}
              className="w-full"
            >
              {keys.map((k, i) => (
                <option key={k.id} value={i}>
                  {k.label} · {k.key.slice(0, 6)}…
                </option>
              ))}
            </select>
          </div>
        )}

        <button onClick={lock} className="btn btn-ghost w-full text-white/70">
          Lock & Clear Keys
        </button>
      </div>
    </div>
  );
}