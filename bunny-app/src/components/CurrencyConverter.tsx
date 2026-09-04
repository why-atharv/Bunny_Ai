import React, { useEffect, useState } from "react";

type Code = "USD" | "EUR" | "GBP" | "JPY";
const SYMBOL: Record<Code, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
const FALLBACK: Record<Code, number> = { USD: 83.42, EUR: 91.05, GBP: 107.6, JPY: 0.567 };

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<number>(1);
  const [target, setTarget] = useState<Code>("USD");
  const [rates, setRates] = useState<Record<Code, number>>(FALLBACK);
  const [asOf, setAsOf] = useState<string>("live · est.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("https://api.exchangerate-api.com/v4/latest/INR")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.rates) return;
        const next: Record<Code, number> = { ...FALLBACK };
        (["USD", "EUR", "GBP", "JPY"] as Code[]).forEach((c) => {
          if (j.rates[c]) next[c] = j.rates[c];
        });
        setRates(next);
        setAsOf(j.date || new Date().toISOString().slice(0, 10));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const converted = (amount * rates[target]).toLocaleString(undefined, {
    maximumFractionDigits: target === "JPY" ? 0 : 2,
  });

  return (
    <div className="glass-strong neon-border rounded-2xl p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-bunny-violet to-bunny-blue flex items-center justify-center">
          💱
        </div>
        <div>
          <div className="font-display text-sm tracking-widest text-white/80">CURRENCY</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50">
            INR Converter · {asOf}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-black/30 rounded-xl p-3 border border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-white/50">From</span>
          <span className="font-display text-2xl">₹ {amount.toLocaleString()}</span>
          <span className="text-[10px] text-white/40">INR · Indian Rupee</span>
        </div>
        <div className="text-bunny-pink text-2xl">→</div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-white/50">To</span>
          <span className="font-display text-2xl glow-text">
            {SYMBOL[target]} {converted}
          </span>
          <span className="text-[10px] text-white/40">{target} · {loading ? "syncing…" : "live"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <label className="text-[10px] uppercase tracking-widest text-white/60 col-span-2">
          Amount (INR)
        </label>
        <input
          type="number"
          value={amount}
          min={0}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="col-span-2"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {(["USD", "EUR", "GBP", "JPY"] as Code[]).map((c) => (
          <button
            key={c}
            onClick={() => setTarget(c)}
            className={`btn ${target === c ? "btn-primary" : "btn-ghost"} flex-col py-2 text-xs`}
          >
            <span className="font-display tracking-widest">{c}</span>
            <span className="text-[10px] text-white/50">{SYMBOL[c]} {rates[c].toFixed(c === "JPY" ? 2 : 3)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}