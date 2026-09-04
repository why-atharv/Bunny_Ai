import React, { useEffect, useMemo, useState } from "react";

interface SeriesPoint {
  t: number;
  v: number;
}

interface WatchItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const FALLBACK_WATCH: WatchItem[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2891.4, change: 1.18 },
  { symbol: "TCS", name: "Tata Consultancy", price: 4112.65, change: -0.42 },
  { symbol: "INFY", name: "Infosys", price: 1645.0, change: 0.81 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1532.3, change: 0.36 },
  { symbol: "TATAMOTORS", name: "Tata Motors", price: 982.4, change: 2.34 },
];

function generateSeries(seed: number, points = 60): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  let v = 100;
  for (let i = 0; i < points; i++) {
    v += Math.sin((i + seed) * 0.4) * 1.6 + ((i * 7 + seed) % 3) - 1.1;
    out.push({ t: i, v });
  }
  return out;
}

export default function StockAnalyzer() {
  const [view, setView] = useState<"analysis" | "watchlist" | "performance">("analysis");
  const [series, setSeries] = useState<SeriesPoint[]>(() => generateSeries(0));
  const [watch] = useState<WatchItem[]>(FALLBACK_WATCH);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1].v;
        const next = last + (Math.random() - 0.5) * 3;
        return [...prev.slice(1), { t: prev[prev.length - 1].t + 1, v: next }];
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const path = useMemo(() => {
    const w = 300;
    const h = 120;
    const min = Math.min(...series.map((p) => p.v));
    const max = Math.max(...series.map((p) => p.v));
    const range = max - min || 1;
    return series
      .map((p, i) => {
        const x = (i / (series.length - 1)) * w;
        const y = h - ((p.v - min) / range) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [series]);

  const fillPath = path + ` L 300 120 L 0 120 Z`;
  const trendUp = series[series.length - 1].v > series[0].v;

  return (
    <div className="glass-strong neon-border rounded-2xl p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-bunny-gold to-bunny-pink flex items-center justify-center">
          📈
        </div>
        <div>
          <div className="font-display text-sm tracking-widest text-white/80">STOCK MARKET</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50">Live Pulse · NSE</div>
        </div>
        <div className="ml-auto flex gap-1">
          {(["analysis", "watchlist", "performance"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`btn text-[10px] px-2 py-1 ${view === v ? "btn-primary" : "btn-ghost"}`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {view === "analysis" && (
          <div className="flex flex-col gap-2 flex-1">
            <div className="text-xs flex items-center gap-3">
              <span className="font-display text-lg glow-text">NIFTY 50</span>
              <span className={trendUp ? "text-emerald-300" : "text-rose-300"}>
                {trendUp ? "▲" : "▼"} {(series[series.length - 1].v - series[0].v).toFixed(2)}
              </span>
              <span className="text-white/40 text-[10px]">~ demo feed</span>
            </div>
            <svg
              viewBox="0 0 300 120"
              className="w-full h-32"
              onMouseLeave={() => setHover(null)}
              onMouseMove={(e) => {
                const r = (e.target as SVGElement).getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * 300;
                const i = Math.round((x / 300) * (series.length - 1));
                setHover(i);
              }}
            >
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendUp ? "#34d399" : "#fb7185"} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={trendUp ? "#34d399" : "#fb7185"} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={fillPath} fill="url(#stockGrad)" />
              <path d={path} fill="none" stroke={trendUp ? "#34d399" : "#fb7185"} strokeWidth="2" />
              {hover != null && series[hover] && (
                <line x1={(hover / (series.length - 1)) * 300} x2={(hover / (series.length - 1)) * 300} y1={0} y2={120} stroke="#fff" strokeOpacity="0.2" />
              )}
              {hover != null && series[hover] && (
                <circle cx={(hover / (series.length - 1)) * 300} cy={
                  (() => {
                    const min = Math.min(...series.map((p) => p.v));
                    const max = Math.max(...series.map((p) => p.v));
                    const range = max - min || 1;
                    return 120 - ((series[hover!].v - min) / range) * 120;
                  })()
                } r="3" fill="#fff" />
              )}
            </svg>
            <div className="text-[10px] text-white/50">
              Hover the chart · {hover != null && series[hover] ? `val ${series[hover].v.toFixed(2)}` : "—"}
            </div>
            {/* Mini candle row */}
            <div className="grid grid-cols-12 gap-0.5 mt-2 h-10">
              {series.slice(-24).map((p, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    height: `${20 + ((p.v % 6) * 4)}%`,
                    background: p.v >= 100 ? "#34d399" : "#fb7185",
                    opacity: 0.8,
                    alignSelf: "flex-end",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {view === "watchlist" && (
          <div className="overflow-y-auto scrollbar-thin space-y-1.5 pr-1">
            {watch.map((w) => (
              <div key={w.symbol} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <div className="text-sm font-medium">{w.symbol}</div>
                  <div className="text-[10px] text-white/50">{w.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-sm">₹ {w.price.toLocaleString()}</div>
                  <div className={`text-[10px] ${w.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {w.change >= 0 ? "▲" : "▼"} {Math.abs(w.change).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "performance" && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "1D", v: "+0.84%", up: true },
              { l: "1W", v: "+2.31%", up: true },
              { l: "1M", v: "-1.12%", up: false },
              { l: "3M", v: "+5.42%", up: true },
              { l: "6M", v: "+8.91%", up: true },
              { l: "1Y", v: "+14.3%", up: true },
            ].map((p) => (
              <div key={p.l} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest text-white/50">{p.l}</div>
                <div className={`font-display text-base ${p.up ? "text-emerald-300" : "text-rose-300"}`}>
                  {p.v}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}