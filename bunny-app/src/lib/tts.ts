import { buildSystemPrompt, makeClient } from "./api";
import { AudioStreamer, base64ToArrayBuffer } from "./audio";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TEXT_MODEL = "gemini-2.5-flash";

export interface TTSSessionOptions {
  apiKey: string;
  audio: AudioStreamer;
  sassiness: "low" | "balanced" | "extreme";
  voice?: "Kore" | "Aoede" | "Leda" | "Puck" | "Charon" | "Fenrir" | "Orus";
  systemOverride?: string;
  onAssistantText?: (text: string) => void;
}

/**
 * TTS mode: SpeechRecognition (browser STT) -> Gemini text model ->
 * Gemini TTS -> AudioStreamer playback. Sliding window keeps the context
 * small enough to be fast and cheap.
 */
export class TTSSession {
  private client: ReturnType<typeof makeClient>;
  private audio: AudioStreamer;
  private opts: TTSSessionOptions;
  private history: { role: "user" | "model"; text: string }[] = [];
  private rec: any = null;
  private running = false;
  private speaking = false;

  constructor(opts: TTSSessionOptions) {
    this.opts = opts;
    this.client = makeClient(opts.apiKey);
    this.audio = opts.audio;
  }

  isActive(): boolean {
    return this.running;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  start(): void {
    if (this.running) return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      this.opts.onAssistantText?.("Sorry Sir, this browser doesn't support Speech Recognition. Try Chrome.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";

    let buffer = "";
    let lastSent = "";

    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      buffer = (final + " " + interim).trim();
      if (final && final.trim() && final.trim() !== lastSent) {
        lastSent = final.trim();
        this.handleUserTurn(final.trim());
        buffer = "";
      }
    };
    rec.onerror = () => {};
    rec.onend = () => {
      if (this.running) {
        try {
          rec.start();
        } catch {}
      }
    };

    this.rec = rec;
    this.running = true;
    try {
      rec.start();
    } catch {}
  }

  stop(): void {
    this.running = false;
    try {
      this.rec?.stop();
    } catch {}
    this.rec = null;
    this.audio.stopPlayback();
    this.speaking = false;
  }

  private pushHistory(role: "user" | "model", text: string) {
    this.history.push({ role, text });
    if (this.history.length > 16) {
      this.history.splice(0, this.history.length - 16);
    }
  }

  private async handleUserTurn(text: string): Promise<void> {
    this.audio.stopPlayback();
    this.speaking = false;
    this.pushHistory("user", text);

    const sys = this.opts.systemOverride || buildSystemPrompt(this.opts.sassiness);

    // Build contents: system + sliding window
    const contents = [
      { role: "user", parts: [{ text: sys }] },
      { role: "model", parts: [{ text: "Understood Sir." }] },
      ...this.history.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    ];

    try {
      const res = await this.client.models.generateContent({
        model: TEXT_MODEL,
        contents,
      });
      const reply = (res.text || "").trim();
      if (!reply) return;
      this.pushHistory("model", reply);
      this.opts.onAssistantText?.(reply);
      await this.speak(reply);
    } catch (e: any) {
      this.opts.onAssistantText?.(`Sorry Sir, ${e?.message || "something went wrong"}.`);
    }
  }

  /** Public so the UI can ask the assistant a typed question from history view too. */
  async ask(text: string): Promise<void> {
    await this.handleUserTurn(text);
  }

  private async speak(text: string): Promise<void> {
    try {
      const voice = this.opts.voice || "Kore";
      const res = await this.client.models.generateContent({
        model: TTS_MODEL,
        contents: [{ role: "user", parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      });
      const part = res.candidates?.[0]?.content?.parts?.[0];
      const b64 = part?.inlineData?.data;
      if (!b64) return;
      this.speaking = true;
      this.audio.playPcm(base64ToArrayBuffer(b64), 24000);
      // naive end detection - estimate duration by sample count / rate
      const bytes = atob(b64).length;
      const durationMs = Math.max(800, Math.round(((bytes / 2) / 24000) * 1000));
      await new Promise((r) => setTimeout(r, durationMs));
      this.speaking = false;
    } catch (e: any) {
      this.speaking = false;
      this.opts.onAssistantText?.(`TTS failed Sir: ${e?.message || "unknown error"}`);
    }
  }
}