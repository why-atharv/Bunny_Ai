import React, { useEffect, useRef, useState } from "react";
import type { ConnState } from "../types";

interface Props {
  state: ConnState;
  speakerLevel: number; // 0..1
  micLevel: number; // 0..1
}

/**
 * Fluffy Pink Bunny avatar — matching the reference image.
 * Cute, pink, big ears, neon ring, large sparkling eyes.
 * Built entirely in SVG so it stays sharp at every size.
 *
 * Lip-sync is driven by `speakerLevel` (RMS-style, 0..1).
 */
export default function BunnyAvatar({ state, speakerLevel, micLevel }: Props) {
  const headRef = useRef<SVGGElement>(null);
  const leftEarRef = useRef<SVGGElement>(null);
  const rightEarRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const [blink, setBlink] = useState(false);

  // Natural blink every few seconds
  useEffect(() => {
    let timeout: any;
    const loop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
      timeout = setTimeout(loop, 3200 + Math.random() * 2200);
    };
    timeout = setTimeout(loop, 1500);
    return () => clearTimeout(timeout);
  }, []);

  // Gentle head sway driven by speaker/mic
  useEffect(() => {
    let raf = 0;
    let t = 0;
    const step = () => {
      t += 0.016;
      const sway = Math.sin(t * 1.2) * 1.4 + (micLevel - speakerLevel) * 4;
      const tilt = Math.cos(t * 0.9) * 1.2 + (speakerLevel - micLevel) * 3;
      if (headRef.current) {
        headRef.current.setAttribute("transform", `rotate(${tilt.toFixed(2)} 250 280) translate(${sway.toFixed(2)} 0)`);
      }
      const ear = Math.sin(t * 1.6) * (state === "speaking" ? 8 : 4);
      if (leftEarRef.current)
        leftEarRef.current.setAttribute("transform", `rotate(${(ear - 5).toFixed(2)} 150 140)`);
      if (rightEarRef.current)
        rightEarRef.current.setAttribute("transform", `rotate(${(-ear + 5).toFixed(2)} 350 140)`);

      // Mouth shape: open based on speakerLevel
      if (mouthRef.current) {
        const lv = Math.max(0, speakerLevel * 1.5);
        const w = 16 + lv * 12;
        const h = lv * 18;
        mouthRef.current.setAttribute("d", `M ${250 - w / 2} 336 Q 250 ${336 + h} ${250 + w / 2} 336 Z`);
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speakerLevel, micLevel, state]);

  const eyeOpen = !blink;

  // Background ring glow based on state
  const halo =
    state === "speaking"
      ? "#ff5ec4"
      : state === "listening"
      ? "#3aa8ff"
      : state === "connecting"
      ? "#b76bff"
      : "#e07fff";

  return (
    <div className="relative w-full max-w-[460px] mx-auto aspect-square">
      <svg viewBox="0 0 500 500" className="relative w-full h-full drop-shadow-[0_20px_40px_rgba(75,29,150,0.45)]">
        <defs>
          <radialGradient id="bunnyPink" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffeeef" />
            <stop offset="60%" stopColor="#ffb3d1" />
            <stop offset="100%" stopColor="#ff9ebf" />
          </radialGradient>
          <linearGradient id="bunnyDarkPink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb3d1" />
            <stop offset="100%" stopColor="#ff73a8" />
          </linearGradient>
          <linearGradient id="bowTie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6ea6" />
            <stop offset="100%" stopColor="#e62e6e" />
          </linearGradient>
          <radialGradient id="eyeGradient" cx="50%" cy="70%" r="60%">
            <stop offset="0%" stopColor="#bc55a5" />
            <stop offset="50%" stopColor="#5e1b4b" />
            <stop offset="100%" stopColor="#1a0414" />
          </radialGradient>
          <filter id="blurCheek">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Neon Ring Background */}
        <circle cx="250" cy="270" r="190" fill="none" stroke={halo} strokeWidth="8" opacity="0.8" style={{ filter: `drop-shadow(0 0 12px ${halo})`, transition: 'stroke 0.5s' }} />
        <circle cx="250" cy="270" r="190" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.9" />

        {/* Body (Back) */}
        <path d="M 130 500 C 130 380 370 380 370 500 Z" fill="url(#bunnyPink)" />
        <path d="M 170 500 C 170 420 330 420 330 500 Z" fill="#ffffff" opacity="0.25" />

        {/* Ears */}
        <g ref={leftEarRef} transform="rotate(-5 150 140)">
          <ellipse cx="150" cy="110" rx="42" ry="140" fill="url(#bunnyPink)" />
          <ellipse cx="150" cy="125" rx="22" ry="110" fill="url(#bunnyDarkPink)" />
        </g>
        <g ref={rightEarRef} transform="rotate(5 350 140)">
          <ellipse cx="350" cy="110" rx="42" ry="140" fill="url(#bunnyPink)" />
          <ellipse cx="350" cy="125" rx="22" ry="110" fill="url(#bunnyDarkPink)" />
        </g>

        {/* Head Group */}
        <g ref={headRef}>
          {/* Head base */}
          <ellipse cx="250" cy="300" rx="160" ry="145" fill="url(#bunnyPink)" />

          {/* Forehead markings */}
          <g fill="#ff99b8" opacity="0.8">
            <path d="M 250 185 L 240 200 L 260 200 Z" />
            <path d="M 215 192 L 205 207 L 225 207 Z" />
            <path d="M 285 192 L 275 207 L 295 207 Z" />
          </g>

          {/* Cheeks */}
          <ellipse cx="130" cy="325" rx="35" ry="25" fill="#ff73a8" opacity="0.55" filter="url(#blurCheek)" />
          <ellipse cx="370" cy="325" rx="35" ry="25" fill="#ff73a8" opacity="0.55" filter="url(#blurCheek)" />
          
          {/* Sparkles on cheeks */}
          <g fill="#fff" opacity="0.8">
            <circle cx="115" cy="320" r="1.5" />
            <circle cx="125" cy="315" r="1" />
            <circle cx="135" cy="325" r="2" />
            <circle cx="145" cy="318" r="1.5" />
            <circle cx="385" cy="320" r="1.5" />
            <circle cx="375" cy="315" r="1" />
            <circle cx="365" cy="325" r="2" />
            <circle cx="355" cy="318" r="1.5" />
          </g>

          {/* Whiskers */}
          <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
            <path d="M 100 315 L 40 305" />
            <path d="M 95 330 L 30 330" />
            <path d="M 100 345 L 40 355" />
            <path d="M 400 315 L 460 305" />
            <path d="M 405 330 L 470 330" />
            <path d="M 400 345 L 460 355" />
          </g>

          {/* Eyelashes */}
          <g stroke="#260b21" strokeWidth="2.5" strokeLinecap="round">
            <path d="M 148 270 L 136 260 M 145 285 L 132 280" />
            <path d="M 352 270 L 364 260 M 355 285 L 368 280" />
          </g>

          {/* Left Eye */}
          <ellipse cx="178" cy="285" rx="30" ry={eyeOpen ? 36 : 2} fill="#260b21" />
          { eyeOpen && (
            <g>
              <ellipse cx="178" cy="295" rx="26" ry="18" fill="url(#eyeGradient)" />
              {/* Big 4-point star highlight */}
              <path d="M 178 260 Q 178 274 164 274 Q 178 274 178 288 Q 178 274 192 274 Q 178 274 178 260 Z" fill="#fff" />
              {/* Secondary sparkles */}
              <circle cx="168" cy="298" r="4.5" fill="#fff" opacity="0.9" />
              <circle cx="190" cy="308" r="2.5" fill="#fff" opacity="0.8" />
            </g>
          )}

          {/* Right Eye */}
          <ellipse cx="322" cy="285" rx="30" ry={eyeOpen ? 36 : 2} fill="#260b21" />
          { eyeOpen && (
            <g>
              <ellipse cx="322" cy="295" rx="26" ry="18" fill="url(#eyeGradient)" />
              {/* Big 4-point star highlight */}
              <path d="M 322 260 Q 322 274 308 274 Q 322 274 322 288 Q 322 274 336 274 Q 322 274 322 260 Z" fill="#fff" />
              {/* Secondary sparkles */}
              <circle cx="312" cy="298" r="4.5" fill="#fff" opacity="0.9" />
              <circle cx="334" cy="308" r="2.5" fill="#fff" opacity="0.8" />
            </g>
          )}

          {/* Nose */}
          <ellipse cx="250" cy="320" rx="9" ry="6.5" fill="#ff73a8" />
          <ellipse cx="250" cy="318" rx="4" ry="2.5" fill="#fff" opacity="0.7" />

          {/* Mouth (w shape) */}
          <path d="M 225 332 Q 237 348 250 336 Q 263 348 275 332" stroke="#e63973" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Animated speaking mouth */}
          <path ref={mouthRef} fill="#e63973" d="M 240 336 Q 250 336 260 336 Q 250 336 240 336 Z" />
        </g>

        {/* Bow Tie (Front) */}
        <g transform="translate(0, 10)">
          <path d="M 250 425 C 230 405 170 395 170 435 C 170 465 230 445 250 425 Z" fill="url(#bowTie)" stroke="#e63973" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 250 425 C 270 405 330 395 330 435 C 330 465 270 445 250 425 Z" fill="url(#bowTie)" stroke="#e63973" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="250" cy="425" r="16" fill="#ff4d88" stroke="#e63973" strokeWidth="2.5" />
          <circle cx="250" cy="420" r="6" fill="#fff" opacity="0.6" />
        </g>
      </svg>

      {/* Status pill */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass-strong px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.25em] flex items-center gap-2 text-white">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: halo,
            boxShadow: `0 0 10px ${halo}`
          }}
        />
        {state === "disconnected" ? "Tap mic to start" : state}
      </div>
    </div>
  );
}