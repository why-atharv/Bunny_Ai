import React, { useEffect, useState } from "react";
import { AppProvider, useApp } from "./lib/state";
import AuthGate from "./components/AuthGate";
import AssistantView from "./components/AssistantView";
import HistoryView from "./components/HistoryView";
import Clock from "./components/Clock";
import SettingsPanel from "./components/SettingsPanel";
import CurrentAffairs from "./components/CurrentAffairs";
import ProductivityHub from "./components/ProductivityHub";
import CurrencyConverter from "./components/CurrencyConverter";
import StockAnalyzer from "./components/StockAnalyzer";
import { countMemories } from "./lib/supabase";

function Shell() {
  const { unlocked } = useApp();
  const [view, setView] = useState<"assistant" | "dashboard" | "history">("assistant");
  const [settings, setSettings] = useState(false);
  const [memCount, setMemCount] = useState<number>(0);

  useEffect(() => {
    if (!unlocked) return;
    countMemories().then(setMemCount).catch(() => {});
  }, [unlocked, view]);

  if (!unlocked) return <AuthGate />;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 z-40">
        <div className="glass border-b border-white/10 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bunny-pink via-bunny-violet to-bunny-blue flex items-center justify-center text-sm shadow-glow">
                🐰
              </div>
              <div className="hidden sm:block">
                <div className="font-display text-sm tracking-widest leading-none glow-text">
                  CUTE FEMALE BUNNY
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/50">
                  Voice AI · {memCount} memories
                </div>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <Clock />
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex glass rounded-full p-1 text-xs">
                {(["assistant", "dashboard", "history"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 rounded-full transition capitalize ${
                      view === v ? "bg-bunny-pink/30 text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSettings(true)}
                className="btn btn-ghost text-sm px-3 py-1.5"
                aria-label="Settings"
              >
                ⚙
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="md:hidden flex justify-center gap-1 pb-2">
            {(["assistant", "dashboard", "history"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs rounded-full capitalize ${
                  view === v ? "bg-bunny-pink/30 text-white" : "text-white/60"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-24 h-full overflow-y-auto">
        {view === "assistant" && <AssistantView />}
        {view === "history" && <HistoryView />}
        {view === "dashboard" && (
          <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
            <CurrentAffairs />
            <CurrencyConverter />
            <ProductivityHub />
            <StockAnalyzer />
          </div>
        )}
      </div>

      <SettingsPanel open={settings} onClose={() => setSettings(false)} />

      {/* Toast */}
      <Toast />
    </div>
  );
}

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-strong neon-border px-4 py-2 rounded-full text-sm shadow-glow animate-floaty">
      {toast}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}