export type VoiceMode = "live" | "tts";
export type Sassiness = "low" | "balanced" | "extreme";
export type ConnState = "disconnected" | "connecting" | "listening" | "speaking" | "idle";
export type Tone = "calm" | "warm" | "playful" | "sassy";

export interface ApiKey {
  id: string;
  label: string;
  key: string;
}

export interface AuthData {
  keys: ApiKey[];
  activeKeyIndex: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_label: string;
  created_at: string;
}