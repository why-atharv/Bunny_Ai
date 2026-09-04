// Generic helpers used across the app.

export function uid(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function clamp(n: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Detect the emotional tone of an AI reply so the background gradient
 * can shift accordingly. Uses a tiny lexicon - cheap and deterministic.
 */
export function detectTone(text: string): import("./../types").Tone {
  const t = text.toLowerCase();
  const playful = ["haha", "lol", "😄", "😉", "fun", "kidding", "tease", "silly", "cute"];
  const sassy = ["obviously", "duh", "please", "seriously?", "excuse me", "darling", "honestly"];
  const warm = ["love", "sweet", "sweetie", "care", "happy", "glad", "welcome", "💖", "🥰"];
  const calm = ["sure", "okay", "alright", "of course", "no worries", "calm", "breathe"];
  if (playful.some((w) => t.includes(w))) return "playful";
  if (sassy.some((w) => t.includes(w))) return "sassy";
  if (warm.some((w) => t.includes(w))) return "warm";
  if (calm.some((w) => t.includes(w))) return "calm";
  return "calm";
}

export function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss} ${ampm}`;
}

export function formatDate(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** De-dup overlapping transcript chunks. */
export function dedupTranscript(prev: string, next: string): string {
  if (!prev) return next;
  if (!next) return prev;
  if (prev === next) return prev;
  // Try to detect overlap where end of prev matches start of next
  const max = Math.min(prev.length, next.length, 200);
  for (let i = max; i >= 10; i--) {
    if (prev.slice(-i) === next.slice(0, i)) {
      return prev + next.slice(i);
    }
  }
  // Otherwise: append with a space if it looks like continuation
  if (prev.endsWith(" ") || next.startsWith(" ")) return (prev + next).trim() + " ";
  return prev + " " + next;
}