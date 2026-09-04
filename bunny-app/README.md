# 🐰 Cute Female Bunny — Voice AI

A real-time, voice-first AI assistant for **Atharv Sir** with persistent Supabase memory, a sassiness engine, dual voice modes (Live + TTS), and a celestial glassmorphism dashboard.

## ✨ Highlights

- **Auth Gate** — password `2004` and up to 10 Gemini API keys (rotatable in Settings)
- **Live mode** — `gemini-3.1-flash-live-preview` with 16 kHz PCM in, 24 kHz PCM out, tool calling (`openWebsite`) and barge-in
- **TTS mode** — Browser `SpeechRecognition` → `gemini-2.5-flash` text → `gemini-2.5-flash-preview-tts` speech
- **Bunny persona** — Hinglish, addresses you as "Sir", says she is "Cute Female Bunny" and treats the user as "Atharv Sir"
- **Sassiness engine** — Low / Balanced / Extreme
- **Bunny avatar** — anime portrait matching the reference (light-brown hair, amber eyes, cream sweater) with state-based expressions and lip-sync
- **Memory** — Supabase `chat_sessions` + `chat_messages` with replay timeline
- **Dashboard** — Current Affairs, Productivity Hub, Currency Converter, Stock Market Analyzer

## 🧱 Tech Stack

- React 19 + TypeScript + Vite
- `@google/genai` (Live + TTS + text)
- `@supabase/supabase-js`
- Tailwind CSS (via CDN — zero build step)
- Browser `AudioContext` + `AudioWorklet` + `ScriptProcessor` fallback

## 🚀 Setup

```bash
npm install
cp .env.example .env       # add your Supabase URL + anon key
npm run dev                # http://localhost:5173
```

Then:

1. Create a Supabase project and run `sql/supabase.sql` in the SQL editor.
2. Add the URL + anon key to `.env`.
3. Open the app, enter password `2004`, paste a Gemini API key.
4. Tap the mic to start.

## 🧠 Architecture

```
src/
├─ App.tsx               # Router shell, top bar, view switching
├─ lib/
│  ├─ state.tsx          # AppProvider / global state (sassiness, mode, conn)
│  ├─ audio.ts           # AudioStreamer (mic PCM16@16k, playback PCM@24k)
│  ├─ liveSession.ts     # Gemini Live wrapper (tool calls + transcripts)
│  ├─ tts.ts             # SpeechRecognition + Gemini text + TTS playback
│  ├─ supabase.ts        # Sessions + messages CRUD
│  └─ api.ts             # GoogleGenAI factory + persona system prompt
└─ components/
   ├─ AuthGate.tsx
   ├─ AssistantView.tsx
   ├─ BunnyAvatar.tsx    # SVG portrait + state-driven lip-sync
   ├─ HistoryView.tsx    # Sessions list + replay timeline
   ├─ SettingsPanel.tsx
   ├─ Clock.tsx
   ├─ CurrentAffairs.tsx
   ├─ ProductivityHub.tsx
   ├─ CurrencyConverter.tsx
   └─ StockAnalyzer.tsx
```

State machine: `disconnected → connecting → listening ↔ speaking → idle`.

## 🔐 Safety

- No secrets in source. Keys live in the Auth Gate (memory only) and `.env`.
- API keys never leave the browser.
- All Supabase access uses the **anon** key — tighten the RLS policies in `sql/supabase.sql` before exposing this app to anyone other than yourself.