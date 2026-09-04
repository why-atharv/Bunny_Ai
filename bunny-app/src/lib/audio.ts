/**
 * AudioStreamer — handles microphone capture and PCM playback through the
 * Web Audio API. Works on top of an AudioContext that is created lazily on
 * first user gesture to comply with browser autoplay policies.
 */
export class AudioStreamer {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private levelCallback: ((l: number) => void) | null = null;
  private playing = false;
  private nextStartTime = 0;
  private activeSource: AudioBufferSourceNode | null = null;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      this.ctx = new AC({ sampleRate: 24000 });
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  async startMic(
    onPcm: (buf: ArrayBuffer) => void,
    onLevel?: (l: number) => void
  ): Promise<void> {
    if (this.micStream) return;
    const ctx = this.ensureCtx();

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.micSource = ctx.createMediaStreamSource(this.micStream);

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.micSource.connect(this.analyser);
    this.levelCallback = onLevel || null;

    const targetRate = 16000;
    const sourceRate = ctx.sampleRate;
    const ratio = sourceRate / targetRate;

    try {
      await ctx.audioWorklet.addModule(this.workletUrl());
      const node = new AudioWorkletNode(ctx, "pcm-downsampler");
      node.port.postMessage({ ratio });
      node.port.onmessage = (e: MessageEvent) => {
        if (e.data?.pcm) onPcm(e.data.pcm as ArrayBuffer);
      };
      this.micSource.connect(node);
      this.micNode = node;
    } catch {
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      let ring: Float32Array[] = [];
      proc.onaudioprocess = (e) => {
        const ch = e.inputBuffer.getChannelData(0);
        ring.push(new Float32Array(ch));
        const total = ring.reduce((s, a) => s + a.length, 0);
        if (total >= sourceRate * 0.05) {
          const merged = new Float32Array(total);
          let o = 0;
          for (const a of ring) {
            merged.set(a, o);
            o += a.length;
          }
          ring = [];
          const pcm = downsampleToInt16(merged, ratio);
          const ab = new ArrayBuffer(pcm.byteLength);
          new Uint8Array(ab).set(new Uint8Array(pcm.buffer));
          onPcm(ab);
        }
      };
      this.micSource.connect(proc);
      this.micNode = proc;
    }

    this.tickLevel();
  }

  private tickLevel = () => {
    if (!this.analyser || !this.levelCallback) return;
    const buf = new Uint8Array(this.analyser.fftSize);
    const draw = () => {
      if (!this.analyser || !this.levelCallback) return;
      this.analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      this.levelCallback(Math.min(1, rms * 2.5));
      requestAnimationFrame(draw);
    };
    draw();
  };

  private workletUrl(): string {
    const code = `
      class PCMDown extends AudioWorkletProcessor {
        constructor() {
          super();
          this.ratio = 1;
          this.acc = [];
          this.accLen = 0;
          this.port.onmessage = (e) => {
            if (typeof e.data.ratio === 'number') this.ratio = e.data.ratio;
          };
        }
        process(inputs) {
          const ch = inputs[0]?.[0];
          if (!ch) return true;
          const target = Math.floor(ch.length / this.ratio);
          const out = new Int16Array(target);
          for (let i = 0; i < target; i++) {
            const idx = Math.floor(i * this.ratio);
            let s = ch[idx];
            s = Math.max(-1, Math.min(1, s));
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          this.port.postMessage({ pcm: out.buffer }, [out.buffer]);
          return true;
        }
      }
      registerProcessor('pcm-downsampler', PCMDown);
    `;
    const blob = new Blob([code], { type: "application/javascript" });
    return URL.createObjectURL(blob);
  }

  stopMic(): void {
    try {
      this.micNode && (this.micNode as any).disconnect?.();
    } catch {}
    this.micNode = null;
    try {
      this.micSource?.disconnect();
    } catch {}
    this.micSource = null;
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = null;
    this.analyser = null;
    this.levelCallback = null;
  }

  playPcm(pcm16: ArrayBuffer, sampleRate = 24000): void {
    const ctx = this.ensureCtx();
    const int16 = new Int16Array(pcm16);
    const f32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 0x8000;

    const buf = ctx.createBuffer(1, f32.length, sampleRate);
    buf.copyToChannel(f32, 0);

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const now = ctx.currentTime;
    const start = Math.max(now, this.nextStartTime);
    src.start(start);
    this.nextStartTime = start + buf.duration;
    this.activeSource = src;
    this.playing = true;
  }

  stopPlayback(): void {
    try {
      this.activeSource?.stop();
    } catch {}
    this.activeSource = null;
    this.nextStartTime = 0;
    this.playing = false;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  stop(): void {
    this.stopMic();
    this.stopPlayback();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

function downsampleToInt16(input: Float32Array, ratio: number): Int16Array {
  const target = Math.floor(input.length / ratio);
  const out = new Int16Array(target);
  for (let i = 0; i < target; i++) {
    let s = input[Math.floor(i * ratio)];
    s = Math.max(-1, Math.min(1, s));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const len = bin.length;
  const out = new ArrayBuffer(len);
  const view = new Uint8Array(out);
  for (let i = 0; i < len; i++) view[i] = bin.charCodeAt(i);
  return out;
}