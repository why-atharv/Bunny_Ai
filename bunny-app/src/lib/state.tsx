import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import type { ApiKey, ConnState, Sassiness, Tone, VoiceMode } from "../types";
import { detectTone } from "./utils";

interface AppState {
  // Auth
  unlocked: boolean;
  keys: ApiKey[];
  activeKeyIndex: number;
  setKeys: (k: ApiKey[]) => void;
  setActiveKeyIndex: (i: number) => void;
  unlock: () => void;
  lock: () => void;
  activeKey: () => string;

  // Voice config
  voiceMode: VoiceMode;
  setVoiceMode: (m: VoiceMode) => void;
  sassiness: Sassiness;
  setSassiness: (s: Sassiness) => void;

  // Session state
  connState: ConnState;
  setConnState: (s: ConnState) => void;

  micLevel: number;
  setMicLevel: Dispatch<SetStateAction<number>>;
  speakerLevel: number;
  setSpeakerLevel: Dispatch<SetStateAction<number>>;

  // Tone / background
  tone: Tone;
  setToneFromText: (t: string) => void;

  // Current session
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Toasts
  toast: string | null;
  setToast: (s: string | null) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [activeKeyIndex, setActiveKeyIndex] = useState(0);

  const [voiceMode, setVoiceMode] = useState<VoiceMode>("live");
  const [sassiness, setSassiness] = useState<Sassiness>("balanced");
  const [connState, setConnState] = useState<ConnState>("disconnected");
  const [micLevel, setMicLevel] = useState(0);
  const [speakerLevel, setSpeakerLevel] = useState(0);
  const [tone, setTone] = useState<Tone>("calm");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Auto-clear toasts
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const activeKey = () => keys[activeKeyIndex]?.key || "";

  const value: AppState = {
    unlocked,
    keys,
    activeKeyIndex,
    setKeys,
    setActiveKeyIndex,
    unlock: () => setUnlocked(true),
    lock: () => setUnlocked(false),
    activeKey,
    voiceMode,
    setVoiceMode,
    sassiness,
    setSassiness,
    connState,
    setConnState,
    micLevel,
    setMicLevel,
    speakerLevel,
    setSpeakerLevel,
    tone,
    setToneFromText: (t: string) => setTone(detectTone(t)),
    sessionId,
    setSessionId,
    toast,
    setToast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}