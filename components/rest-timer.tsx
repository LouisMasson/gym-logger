'use client';

import { useEffect, useRef, useState } from 'react';

const PRESETS = [60, 90, 120, 180];
const STORAGE_KEY = 'gym-rest-timer-default';

function readDefault(): number {
  if (typeof window === 'undefined') return 90;
  const v = parseInt(localStorage.getItem(STORAGE_KEY) ?? '90', 10);
  return PRESETS.includes(v) ? v : 90;
}

function beep() {
  try {
    type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };
    const w = window as WindowWithWebkitAudio;
    const Ctx = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    o.type = 'sine';
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.42);
    setTimeout(() => ctx.close(), 700);
  } catch {
    // No audio available — fail silently.
  }
}

export type RestTimerHandle = {
  start: () => void;
  stop: () => void;
};

export default function RestTimer({
  onReady,
}: {
  onReady?: (handle: RestTimerHandle) => void;
}) {
  const [duration, setDuration] = useState<number>(() => readDefault());
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const beeped = useRef(false);

  useEffect(() => {
    const handle: RestTimerHandle = {
      start: () => {
        beeped.current = false;
        setEndsAt(Date.now() + duration * 1000);
      },
      stop: () => setEndsAt(null),
    };
    onReady?.(handle);
  }, [duration, onReady]);

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!endsAt) return;
    if (remaining === 0 && !beeped.current) {
      beeped.current = true;
      beep();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([200, 100, 200]);
      }
    }
  }, [remaining, endsAt]);

  function persist(d: number) {
    setDuration(d);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, String(d));
  }

  if (!endsAt) {
    return (
      <div className="flex items-center justify-between mt-3 text-[12px]">
        <span className="label-xs">Repos auto</span>
        <div className="flex gap-1">
          {PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => persist(d)}
              className="px-2 py-0.5 rounded font-mono tnum text-[11px]"
              style={{
                background: duration === d ? 'var(--accent)' : 'transparent',
                color: duration === d ? '#0A0B0D' : 'var(--muted)',
                border: duration === d ? 'none' : '1px solid var(--border)',
              }}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>
    );
  }

  const isDone = remaining === 0;
  const pct = Math.max(0, Math.min(100, ((duration - remaining) / duration) * 100));
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div
      className="mt-3 rounded-xl p-3 border transition-colors"
      style={{
        background: isDone ? 'rgba(212,255,61,0.12)' : 'var(--surface)',
        borderColor: isDone ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="label-xs">{isDone ? 'Prêt pour la suivante' : 'Repos en cours'}</span>
        <button
          onClick={() => setEndsAt(null)}
          className="text-muted text-[12px] hover:text-text"
          aria-label="Annuler le repos"
        >
          Skip
        </button>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <span
          className="font-display italic tnum text-[36px] leading-none"
          style={{ color: isDone ? 'var(--accent)' : 'var(--text)' }}
        >
          {mm}:{ss}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setEndsAt((endsAt ?? Date.now()) + 15000)}
            className="text-[11px] px-2 py-0.5 rounded border border-border text-muted hover:text-text"
          >
            +15s
          </button>
          <button
            onClick={() => setEndsAt((endsAt ?? Date.now()) - 15000)}
            className="text-[11px] px-2 py-0.5 rounded border border-border text-muted hover:text-text"
          >
            −15s
          </button>
        </div>
      </div>
      <div
        className="mt-2 h-1 rounded-full overflow-hidden"
        style={{ background: 'var(--surface-2)' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: 'var(--accent)' }}
        />
      </div>
    </div>
  );
}
