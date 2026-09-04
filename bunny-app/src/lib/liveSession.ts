import { buildSystemPrompt, makeClient } from "./api";
import { AudioStreamer } from "./audio";

export interface LiveSessionCallbacks {
  onState?: (state: "connecting" | "listening" | "speaking" | "disconnected") => void;
  onUserTranscript?: (text: string, final: boolean) => void;
  onModelTranscript?: (text: string, final: boolean) => void;
  onAssistantMessage?: (text: string) => void;
  onToolCall?: (name: string, args: any) => Promise<any>;
  onError?: (err: string) => void;
}

const TOOLS: any = [
  {
    functionDeclarations: [
      {
        name: "openWebsite",
        description:
          "Open a website in a new browser tab. Use when the user asks to visit, open, or show a webpage.",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string", description: "Full URL including https://" },
            description: { type: "string", description: "Optional short reason" },
          },
          required: ["url"],
        },
      },
    ],
  },
];

const MODEL = "gemini-3.1-flash-live-preview";

export class LiveSession {
  private client: ReturnType<typeof makeClient>;
  private audio: AudioStreamer;
  private cb: LiveSessionCallbacks;
  private session: any = null;

  constructor(apiKey: string, audio: AudioStreamer, cb: LiveSessionCallbacks) {
    this.client = makeClient(apiKey);
    this.audio = audio;
    this.cb = cb;
  }

  async connect(sassiness: "low" | "balanced" | "extreme"): Promise<void> {
    if (this.session) return;
    this.cb.onState?.("connecting");
    try {
      const session = await this.client.live.connect({
        model: MODEL,
        config: {
          responseModalities: ["AUDIO" as any],
          systemInstruction: buildSystemPrompt(sassiness),
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          tools: TOOLS,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            this.cb.onState?.("listening");
            this.audio.startMic((pcm) => {
              try {
                session.sendRealtimeInput({
                  audio: {
                    data: bytesToB64(new Uint8Array(pcm)),
                    mimeType: "audio/pcm;rate=16000",
                  },
                });
              } catch {}
            });
          },
          onmessage: async (msg: any) => {
            try {
              const sc = msg?.serverContent;
              const tc = msg?.toolCall;
              const tIn = msg?.inputTranscription?.text;
              const tOut = msg?.outputTranscription?.text;
              const tFinal =
                msg?.inputTranscription?.isFinal || msg?.outputTranscription?.isFinal;

              if (tIn) this.cb.onUserTranscript?.(tIn, !!tFinal);
              if (tOut) this.cb.onModelTranscript?.(tOut, !!tFinal);

              const parts = sc?.modelTurn?.parts ?? msg?.modelTurn?.parts;
              if (Array.isArray(parts)) {
                for (const part of parts) {
                  if (part?.inlineData?.data) {
                    const ab = base64ToArrayBuffer(part.inlineData.data);
                    this.audio.playPcm(ab, 24000);
                    this.cb.onState?.("speaking");
                  }
                }
              }
              if (sc?.turnComplete) {
                this.cb.onState?.("listening");
              }
              if (sc?.interrupted) {
                this.audio.stopPlayback();
                this.cb.onState?.("listening");
              }

              if (tc?.functionCalls?.length) {
                const responses: any[] = [];
                for (const fc of tc.functionCalls) {
                  let result: any = { ok: true };
                  try {
                    if (this.cb.onToolCall) {
                      result = await this.cb.onToolCall(fc.name, fc.args || {});
                    }
                  } catch (e: any) {
                    result = { error: String(e?.message || e) };
                  }
                  responses.push({ id: fc.id, name: fc.name, response: result });
                }
                try {
                  session.sendToolResponse({ functionResponses: responses });
                } catch {}
              }
            } catch (e) {
              console.warn("live onmessage error", e);
            }
          },
          onerror: (e: any) => {
            console.warn("live error", e);
            this.cb.onError?.(typeof e === "string" ? e : "Live connection error");
            this.cb.onState?.("disconnected");
          },
          onclose: () => {
            this.cb.onState?.("disconnected");
          },
        },
      });
      this.session = session;
    } catch (e: any) {
      this.cb.onError?.(e?.message || "Failed to connect to Live API");
      this.cb.onState?.("disconnected");
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.audio.stopMic();
      this.audio.stopPlayback();
      await this.session?.close?.();
    } catch {}
    this.session = null;
    this.cb.onState?.("disconnected");
  }
}

function bytesToB64(u8: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const len = bin.length;
  const out = new ArrayBuffer(len);
  const view = new Uint8Array(out);
  for (let i = 0; i < len; i++) view[i] = bin.charCodeAt(i);
  return out;
}