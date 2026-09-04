import React, { useState } from "react";
import { useApp } from "../lib/state";
import { uid } from "../lib/utils";
import InteractiveBackground from "./InteractiveBackground";
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
      setToast("Wrong password Sir.");
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
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-[#060114]">
      {/* Interactive Animated Background */}
      <div className="absolute inset-0 z-0">
        <InteractiveBackground tone="warm" sassiness="balanced" />
      </div>

      <div className="relative z-10 w-full max-w-md glass-strong border border-bunny-pink/30 rounded-[40px] p-8 shadow-[0_0_50px_rgba(255,94,196,0.15)] backdrop-blur-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-bunny-pink to-bunny-violet flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(255,94,196,0.4)] animate-floaty transition-transform group-hover:scale-110">
              🐰
            </div>
            <div className="absolute inset-0 rounded-full animate-pulseRing border-[2px] border-bunny-pink/60" />
          </div>
          <h1 className="font-display text-4xl mt-6 text-transparent bg-clip-text bg-gradient-to-r from-[#ff9ebf] to-[#ff5ec4] drop-shadow-md">
            Bunny AI
          </h1>
          <p className="text-bunny-pink/70 font-mono text-xs uppercase tracking-[0.3em] mt-2">
            Voice Intelligence System
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-bunny-pink/80 mb-2 font-bold pl-1">
              Access Code
            </label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-black/20 border border-bunny-pink/20 rounded-2xl py-4 text-2xl tracking-[0.5em] text-center text-bunny-pink focus:border-bunny-pink/60 focus:ring-1 focus:ring-bunny-pink/60 transition-all outline-none placeholder:text-bunny-pink/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-bunny-pink/80 mb-2 font-bold pl-1 pr-1">
              <span>API Connect</span>
              <button
                type="button"
                onClick={addSlot}
                disabled={picked.length >= 10}
                className="text-bunny-violet hover:text-bunny-pink transition-colors disabled:opacity-40"
              >
                + Add Node
              </button>
            </div>
            
            <div className="space-y-3">
              {picked.map((val, i) => (
                <div key={i} className="flex items-center gap-3 bg-black/20 border border-bunny-pink/10 rounded-2xl p-2 transition-colors focus-within:border-bunny-pink/40">
                  <span className="text-bunny-pink/40 font-mono text-[10px] w-8 text-center bg-white/5 rounded py-1">0{i + 1}</span>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={val}
                    onChange={(e) => setSlot(i, e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm text-white/90 font-mono focus:outline-none placeholder:text-white/20"
                  />
                  {picked.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          className="w-full mt-10 py-4 rounded-2xl bg-gradient-to-r from-bunny-pink to-bunny-violet text-white font-bold tracking-wider hover:opacity-90 hover:shadow-[0_0_20px_rgba(255,94,196,0.4)] active:scale-[0.98] transition-all"
        >
          INITIALIZE SYSTEM
        </button>
      </div>
    </div>
  );
}