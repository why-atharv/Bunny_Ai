import React, { useEffect, useState } from "react";
import { useApp } from "../lib/state";

const LS_TODO = "bunny.todo.v1";
const LS_NOTES = "bunny.notes.v1";

export default function ProductivityHub() {
  const { setToast } = useApp();
  const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    try {
      setTodos(JSON.parse(localStorage.getItem(LS_TODO) || "[]"));
      setNotes(localStorage.getItem(LS_NOTES) || "");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TODO, JSON.stringify(todos));
    } catch {}
  }, [todos]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_NOTES, notes);
    } catch {}
  }, [notes]);

  // Blinking neon cursor for notes
  useEffect(() => {
    const id = setInterval(() => setCursor((c) => 1 - c), 520);
    return () => clearInterval(id);
  }, []);

  const addTodo = () => {
    const t = draft.trim();
    if (!t) return;
    setTodos([{ id: Date.now().toString(36), text: t, done: false }, ...todos]);
    setDraft("");
  };

  return (
    <div className="glass-strong neon-border rounded-2xl p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-bunny-blue to-bunny-violet flex items-center justify-center">
          ✨
        </div>
        <div>
          <div className="font-display text-sm tracking-widest text-white/80">PRODUCTIVITY HUB</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50">Tasks + Notes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-hidden">
        {/* TODO LIST */}
        <div className="flex flex-col overflow-hidden">
          <div className="text-[10px] uppercase tracking-widest text-white/60 mb-1">TODO LIST</div>
          <div className="flex gap-2 mb-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="New task…"
              className="flex-1 text-xs"
            />
            <button onClick={addTodo} className="btn btn-primary text-xs px-3">
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5 pr-1">
            {todos.length === 0 && (
              <div className="text-white/40 text-xs italic">No tasks yet. Add one above.</div>
            )}
            {todos.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10"
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => setTodos(todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                  className="w-4 h-4 accent-bunny-pink"
                />
                <span className={`text-xs ${t.done ? "line-through text-white/40" : ""}`}>
                  {t.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* NOTES */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-widest text-white/60">NOTES MAKER</div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(notes).then(
                  () => setToast("Notes copied Sir"),
                  () => setToast("Clipboard blocked")
                );
              }}
              className="text-[10px] text-bunny-blue hover:text-white"
            >
              Copy
            </button>
          </div>
          <div className="relative flex-1">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Start typing your thoughts, Sir…"
              className="w-full h-full resize-none text-xs leading-relaxed p-3"
            />
            <span
              className="pointer-events-none absolute bottom-2 right-3 text-bunny-pink"
              style={{ opacity: cursor }}
            >
              ▍
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}