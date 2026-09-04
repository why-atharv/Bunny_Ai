import React, { useState } from "react";
import { useApp } from "../lib/state";
import { uid } from "../lib/utils";
import type { ApiKey } from "../types";

export default function AuthGate() {
  const { keys, setKeys, setActiveKeyIndex, unlock, setToast } = useApp();
  const [pw, setPw] = useState("");
  const [picked, setPicked] = useState<string[]>([""]);

  const addSlot = () => {
    if (picked.length >= 10) return;
    setPicked([...picked, ""]);
  };
  const removeSlot = (i: number) => {
    setPicked(picked.filter((_, idx) => idx !== i));
  };
  const setSlot = (i: number, v: string) => {
    const next = [...picked];
    next[i] = v;
    setPicked(next);
  };

  const submit = () => {
    if (pw !== "2004") {
      setToast("Wrong password Sir. Hint: it’s the year 2004.");
      return;
    }
    const cleaned = picked.map((s) => s.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setToast("Please paste at least one Gemini API key.");
      return;
    }
    const apiKeys: ApiKey[] = cleaned.map((k, i) => ({ id: uid(), label: `Key ${i + 1}`, key: k }));
    setKeys(apiKeys);
    setActiveKeyIndex(0);
    unlock();
  };

  return (
    <div className="min-h-screen w-full grid-bg flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-bunny-pink/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-bunny-blue/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-bunny-violet/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md glass-strong neon-border rounded-3xl p-6 sm:p-8 shadow-glow">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-bunny-pink via-bunny-violet to-bunny-blue flex items-center justify-center text-4xl shadow-glow animate-floaty">
              🐰
            </div>
            <div className="absolute inset-0 rounded-full animate-pulseRing border border-bunny-pink/40" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl mt-4 glow-text">Cute Female Bunny</h1>
          <p className="text-white/60 text-sm mt-1">Voice AI · Live + TTS · Persistent Memory</p>
        </div>

        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
          Access Password
        </label>
        <input
          type="password"
          inputMode="numeric"
          placeholder="Enter password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full text-lg tracking-[0.4em] text-center"
        />

        <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-widest text-white/60">
          <span>Gemini API Keys (max 10)</span>
          <button
            type="button"
            onClick={addSlot}
            disabled={picked.length >= 10}
            className="text-bunny-pink hover:text-white disabled:opacity-40"
          >
            + Add Key
          </button>
        </div>

        <div className="space-y-2 mt-3">
          {picked.map((val, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-white/40 text-xs w-12 text-center">#{i + 1}</span>
              <input
                type="password"
                placeholder="AIza…"
                value={val}
                onChange={(e) => setSlot(i, e.target.value)}
                className="flex-1 font-mono text-xs"
              />
              {picked.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-white/40 hover:text-white text-sm px-2"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-white/50 mt-3 leading-relaxed">
          Generate it in <span className="text-bunny-pink">Google AI Studio → API Keys</span> (left
          bottom) and paste here. Keys are stored locally in your browser only.
        </p>

        <button
          type="button"
          onClick={submit}
          className="btn btn-primary w-full mt-6 py-3 text-base"
        >
          Unlock Assistant →
        </button>

        <p className="text-[10px] text-white/40 mt-4 text-center uppercase tracking-widest">
          For Atharv Sir · Password 2004
        </p>
      </div>
    </div>
  );
}