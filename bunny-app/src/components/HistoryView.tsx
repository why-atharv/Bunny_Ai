import React, { useEffect, useState } from "react";
import { listMessages, listSessions } from "../lib/supabase";
import type { ChatMessage, ChatSession } from "../types";
import { formatTime, formatDate } from "../lib/utils";

export default function HistoryView() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const s = await listSessions();
      setSessions(s);
      if (s.length) setSelected(s[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const m = await listMessages(selected);
      setMessages(m);
      setRevealed(0);
      setPlaying(false);
    })();
  }, [selected]);

  // Step-by-step replay
  useEffect(() => {
    if (!playing) return;
    if (revealed >= messages.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setRevealed((n) => n + 1), 1200);
    return () => clearTimeout(t);
  }, [playing, revealed, messages.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-full p-4">
      {/* Sessions list */}
      <div className="glass-strong neon-border rounded-2xl p-3 overflow-hidden flex flex-col">
        <div className="text-xs uppercase tracking-widest text-white/60 px-2 py-1 mb-2">Recent Sessions</div>
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
          {loading && <div className="text-white/50 text-sm px-2">Loading…</div>}
          {!loading && sessions.length === 0 && (
            <div className="text-white/50 text-sm px-2 py-6 text-center">
              No saved chats yet. <br />Talk to Bunny to start building memory.
            </div>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`w-full text-left p-3 rounded-xl border transition ${
                selected === s.id
                  ? "bg-bunny-pink/15 border-bunny-pink/40 text-white"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="text-sm font-medium truncate">{s.user_label || "Atharv Sir"}</div>
              <div className="text-[10px] text-white/50 mt-0.5">
                {new Date(s.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transcript timeline */}
      <div className="glass-strong neon-border rounded-2xl p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-widest text-white/60">
            Transcript · {messages.length} turns
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPlaying(true)}
              disabled={!messages.length || playing}
              className="btn btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
            >
              ▶ Replay
            </button>
            <button
              onClick={() => setPlaying(false)}
              disabled={!playing}
              className="btn btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
            >
              ■ Stop
            </button>
            <button
              onClick={() => setRevealed(messages.length)}
              className="btn btn-ghost text-xs px-3 py-1.5"
            >
              Show All
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
          {!messages.length && (
            <div className="text-white/50 text-sm text-center py-10">
              No messages in this session yet.
            </div>
          )}
          {messages.slice(0, revealed).map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-floaty`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-bunny-blue/30 to-bunny-violet/30 border border-bunny-blue/40"
                    : "bg-gradient-to-br from-bunny-pink/25 to-bunny-violet/20 border border-bunny-pink/40"
                }`}
              >
                <div className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">
                  {m.role === "user" ? "Atharv Sir" : "Bunny"}
                </div>
                {m.content}
              </div>
            </div>
          ))}
          {playing && revealed < messages.length && (
            <div className="text-white/40 text-xs text-center animate-pulse">● Bunny is thinking…</div>
          )}
        </div>
      </div>
    </div>
  );
}