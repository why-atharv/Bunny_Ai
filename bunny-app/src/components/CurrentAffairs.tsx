import React, { useEffect, useState } from "react";

interface Item {
  title: string;
  source: string;
  ts: string;
}

const FALLBACK_INDIA: Item[] = [
  { title: "Cabinet clears India-first Digital Public Infrastructure push for 2026", source: "PIB", ts: "2h" },
  { title: "RBI keeps repo rate unchanged; signals consumer-friendly festive outlook", source: "RBI Wire", ts: "4h" },
  { title: "ISRO launches next-gen NavIC satellite cluster from Sriharikota", source: "ISRO", ts: "7h" },
  { title: "Mumbai Metro Line-12 Phase-1 opens to public with record ridership", source: "MMRDA", ts: "9h" },
  { title: "Supreme Court frames new data-protection guidelines for minors", source: "LiveLaw", ts: "12h" },
];

const FALLBACK_GLOBAL: Item[] = [
  { title: "Global AI Safety Summit concludes with first-mover transparency pact", source: "Reuters", ts: "1h" },
  { title: "UN climate finance fund crosses USD 400B milestone", source: "UN News", ts: "3h" },
  { title: "Eurozone inflation eases to 2.1%, lowest in three years", source: "ECB", ts: "5h" },
  { title: "Japan unveils next-gen maglev freight corridor", source: "NHK", ts: "8h" },
  { title: "WHO declares progress on malaria vaccine rollout across Africa", source: "WHO", ts: "11h" },
];

export default function CurrentAffairs() {
  const [tab, setTab] = useState<"local" | "global">("local");
  const [items, setItems] = useState<Item[]>(FALLBACK_INDIA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Try a public RSS-to-JSON feed; gracefully fall back if blocked.
    const url =
      tab === "local"
        ? "https://api.allorigins.win/get?url=" + encodeURIComponent("https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en")
        : "https://api.allorigins.win/get?url=" + encodeURIComponent("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en");
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        const xml: string = j?.contents || "";
        const titles = Array.from(xml.matchAll(/<title>(?!<)([^<]{10,160})<\/title>/g))
          .slice(1, 6)
          .map((m) => m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim());
        if (titles.length) {
          setItems(
            titles.map((t, i) => ({
              title: t,
              source: tab === "local" ? "India Wire" : "World Wire",
              ts: `${i + 1}h`,
            }))
          );
        } else {
          setItems(tab === "local" ? FALLBACK_INDIA : FALLBACK_GLOBAL);
        }
      })
      .catch(() => {
        if (!cancelled) setItems(tab === "local" ? FALLBACK_INDIA : FALLBACK_GLOBAL);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="glass-strong neon-border rounded-2xl p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-bunny-pink to-bunny-violet flex items-center justify-center">
            🇮🇳
          </div>
          <div>
            <div className="font-display text-sm tracking-widest text-white/80">CURRENT AFFAIRS</div>
            <div className="text-[10px] uppercase tracking-widest text-white/50">
              {tab === "local" ? "Local Headlines · India First" : "Global News"}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setTab("local")}
            className={`btn text-[10px] px-2 py-1 ${
              tab === "local" ? "btn-primary" : "btn-ghost"
            }`}
          >
            INDIA
          </button>
          <button
            onClick={() => setTab("global")}
            className={`btn text-[10px] px-2 py-1 ${
              tab === "global" ? "btn-primary" : "btn-ghost"
            }`}
          >
            GLOBAL
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2">
        {loading && <div className="text-white/40 text-xs">Syncing headlines…</div>}
        {items.map((it, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <div className="text-sm leading-snug">{it.title}</div>
            <div className="flex items-center gap-2 mt-1 text-[10px] uppercase tracking-widest text-white/40">
              <span>{it.source}</span>
              <span>·</span>
              <span>{it.ts}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}