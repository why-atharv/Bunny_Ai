import React, { useEffect, useState } from "react";
import { formatDate, formatTime } from "../lib/utils";

export default function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center select-none">
      <div className="font-display text-2xl sm:text-3xl tracking-wider glow-text">
        {formatTime(now)}
      </div>
      <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-[0.3em]">
        {formatDate(now)}
      </div>
    </div>
  );
}