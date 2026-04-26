'use client';

import { useCallback, useMemo, useRef, useState, useTransition, useEffect } from 'react';
import { logSet, deleteSet, endWorkout } from '../actions';
import { deleteWorkout } from '@/app/workout/actions';
import { isRedirect } from '@/lib/errors';
import Link from 'next/link';
import { Trash2 } from '@/components/icons';
import RestTimer, { type RestTimerHandle } from '@/components/rest-timer';

type Workout = { id: string; name: string | null; started_at: string; ended_at: string | null };
type Exercise = { id: string; name: string; muscle_group: string | null };
type Set = {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number | string | null;
  rpe: number | null;
  logged_at: string;
};

function Chrono({ from }: { from: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - new Date(from).getTime()) / 1000));
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return (
    <span className="inline-flex items-center gap-2 text-muted text-[13px]">
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: 'var(--accent)' }}
      />
      <span className="font-mono tnum">{mm}:{ss}</span>
    </span>
  );
}

type LastSetMap = Record<string, { reps: number; weight: number; rpe: number | null }>;

export default function SessionEditor({
  workout,
  exercises,
  initialSets,
  lastSetsByExercise = {},
}: {
  workout: Workout;
  exercises: Exercise[];
  initialSets: Set[];
  lastSetsByExercise?: LastSetMap;
}) {
  const [sets, setSets] = useState<Set[]>(initialSets);
  const initialExoId =
    initialSets[initialSets.length - 1]?.exercise_id ?? exercises[0]?.id ?? '';
  const [selectedExoId, setSelectedExoId] = useState<string>(initialExoId);

  // Pre-fill stepper from last logged set on this exo (across ALL workouts).
  // If user already logged a set on this exo IN this workout, that takes priority.
  function suggestedFor(exoId: string) {
    const inSession = sets.filter((s) => s.exercise_id === exoId);
    const last = inSession[inSession.length - 1];
    if (last) {
      return { reps: last.reps, weight: Number(last.weight_kg ?? 0), rpe: last.rpe ?? 7 };
    }
    const fromHistory = lastSetsByExercise[exoId];
    if (fromHistory) {
      return { reps: fromHistory.reps, weight: fromHistory.weight, rpe: fromHistory.rpe ?? 7 };
    }
    return { reps: 8, weight: 60, rpe: 7 };
  }

  const initialSuggestion = suggestedFor(initialExoId);
  const [reps, setReps] = useState(initialSuggestion.reps);
  const [weight, setWeight] = useState(initialSuggestion.weight);
  const [rpe, setRpe] = useState(initialSuggestion.rpe);
  const [pending, startTransition] = useTransition();
  const [ending, setEnding] = useState(false);
  const restTimerRef = useRef<RestTimerHandle | null>(null);
  const onTimerReady = useCallback((h: RestTimerHandle) => {
    restTimerRef.current = h;
  }, []);

  // When the user picks a different exercise, snap the stepper to its suggested values.
  function changeExercise(newExoId: string) {
    setSelectedExoId(newExoId);
    const s = suggestedFor(newExoId);
    setReps(s.reps);
    setWeight(s.weight);
    setRpe(s.rpe);
  }

  const selectedExo = exercises.find((e) => e.id === selectedExoId);
  const setsForExo = sets.filter((s) => s.exercise_id === selectedExoId);
  const nextSetNumber = setsForExo.length + 1;
  const lastSetSummary = (() => {
    const inSession = setsForExo[setsForExo.length - 1];
    if (inSession) {
      return {
        source: 'séance',
        reps: inSession.reps,
        weight: Number(inSession.weight_kg ?? 0),
        rpe: inSession.rpe,
      };
    }
    const h = lastSetsByExercise[selectedExoId];
    if (h) {
      return { source: 'historique', reps: h.reps, weight: h.weight, rpe: h.rpe };
    }
    return null;
  })();

  const totalVolume = useMemo(
    () => sets.reduce((acc, s) => acc + s.reps * Number(s.weight_kg ?? 0), 0),
    [sets]
  );

  async function handleLog() {
    if (!selectedExoId || reps <= 0) return;
    const optimistic: Set = {
      id: `temp-${Date.now()}`,
      exercise_id: selectedExoId,
      set_number: nextSetNumber,
      reps,
      weight_kg: weight,
      rpe,
      logged_at: new Date().toISOString(),
    };
    setSets((prev) => [...prev, optimistic]);
    // Start the rest countdown immediately (don't wait for the network roundtrip).
    restTimerRef.current?.start();
    startTransition(async () => {
      try {
        const real = await logSet({
          workoutId: workout.id,
          exerciseId: selectedExoId,
          setNumber: nextSetNumber,
          reps,
          weightKg: weight,
          rpe,
        });
        // Replace optimistic temp id with real DB id so the inline ✕ delete works.
        setSets((prev) =>
          prev.map((s) =>
            s.id === optimistic.id ? { ...s, id: real.id, logged_at: real.logged_at } : s
          )
        );
      } catch (e) {
        setSets((prev) => prev.filter((s) => s.id !== optimistic.id));
        restTimerRef.current?.stop();
        alert('Erreur : ' + (e as Error).message);
      }
    });
  }

  async function handleDelete(setId: string) {
    if (setId.startsWith('temp-')) return;
    const prev = sets;
    setSets((s) => s.filter((x) => x.id !== setId));
    startTransition(async () => {
      try {
        await deleteSet(setId, workout.id);
      } catch (e) {
        setSets(prev);
        alert('Erreur : ' + (e as Error).message);
      }
    });
  }

  async function handleEnd() {
    if (sets.length === 0) {
      if (!confirm('Aucune série loggée. Quitter sans enregistrer ?')) return;
    }
    setEnding(true);
    try {
      await endWorkout(workout.id);
    } catch (e) {
      if (isRedirect(e)) throw e;
      setEnding(false);
      alert('Erreur : ' + (e as Error).message);
    }
  }

  async function handleDeleteWorkout() {
    const label = workout.name ?? 'cette séance';
    if (!confirm(`Supprimer "${label}" ? Toutes les séries seront perdues. Cette action est irréversible.`)) return;
    setEnding(true);
    try {
      await deleteWorkout(workout.id, '/');
    } catch (e) {
      if (isRedirect(e)) throw e;
      setEnding(false);
      alert('Erreur : ' + (e as Error).message);
    }
  }

  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-[15px]">← {workout.name ?? 'Séance'}</Link>
        <Chrono from={workout.started_at} />
      </div>

      <div className="mt-5">
        <label className="label-xs">Exercice</label>
        <select
          value={selectedExoId}
          onChange={(e) => changeExercise(e.target.value)}
          className="mt-2 w-full bg-surface border border-border rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent-dim appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'><path fill=\'%238B9199\' d=\'M6 8L0 0h12z\'/></svg>")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
        >
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {selectedExo && (
        <h2 className="font-display italic text-[28px] tracking-tight mt-5">
          {selectedExo.name}
        </h2>
      )}
      <p className="text-muted text-[13px] mt-1 tnum">Série {nextSetNumber}</p>

      {lastSetSummary && (
        <button
          type="button"
          onClick={() => {
            setReps(lastSetSummary.reps);
            setWeight(lastSetSummary.weight);
            if (lastSetSummary.rpe != null) setRpe(lastSetSummary.rpe);
          }}
          className="mt-3 w-full text-left rounded-xl border border-border px-3 py-2 hover:border-accent-dim transition-colors"
          style={{ background: 'rgba(212, 255, 61, 0.05)' }}
          aria-label="Reprendre la dernière série"
        >
          <span className="label-xs">Dernière série · {lastSetSummary.source}</span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="font-mono tnum text-[15px]">
              {lastSetSummary.weight} kg <span className="text-muted">×</span> {lastSetSummary.reps}
              {lastSetSummary.rpe != null && <span className="text-muted"> · RPE {lastSetSummary.rpe}</span>}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--accent)' }}>↑ reprendre</span>
          </div>
        </button>
      )}

      <StepperRow label="kg" value={weight} onDec={() => setWeight((v) => Math.max(0, +(v - 2.5).toFixed(2)))} onInc={() => setWeight((v) => +(v + 2.5).toFixed(2))} />
      <StepperRow label="rep" value={reps} onDec={() => setReps((v) => Math.max(0, v - 1))} onInc={() => setReps((v) => v + 1)} />

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="label-xs">Effort perçu (RPE)</span>
          <span className="font-mono tnum text-[18px]" style={{ color: 'var(--accent)' }}>{rpe}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={rpe}
          onChange={(e) => setRpe(parseInt(e.target.value))}
          className="w-full mt-3 accent-[var(--accent)]"
        />
      </div>

      <button onClick={handleLog} disabled={pending || !selectedExoId} className="btn-primary mt-6">
        {pending ? 'Enregistrement…' : 'Valider la série'}
      </button>

      <RestTimer onReady={onTimerReady} />

      {setsForExo.length > 0 && (
        <>
          <p className="label-xs mt-8 mb-2">Séries déjà faites — {selectedExo?.name}</p>
          <div className="card p-0 overflow-hidden">
            {setsForExo.map((s, idx) => (
              <div
                key={s.id}
                className="grid grid-cols-[24px_1fr_32px] items-center px-4 py-3 text-[14px]"
                style={{ borderBottom: idx === setsForExo.length - 1 ? 'none' : '1px solid var(--border)' }}
              >
                <span className="font-mono font-semibold text-muted">{s.set_number}</span>
                <span className="tnum">
                  {Number(s.weight_kg ?? 0)} kg <span className="text-muted">×</span> {s.reps}
                  {s.rpe != null && <span className="text-muted"> · RPE {s.rpe}</span>}
                </span>
                <button
                  onClick={() => handleDelete(s.id)}
                  aria-label="Supprimer"
                  className="text-muted hover:text-danger"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 card">
        <div className="flex items-center justify-between">
          <span className="label-xs">Volume séance</span>
          <span className="font-display italic text-[24px] tnum">
            {new Intl.NumberFormat('fr-FR').format(Math.round(totalVolume))}
            <span className="text-muted text-[14px] ml-1">kg</span>
          </span>
        </div>
        <div className="text-muted text-[12px] mt-1 tnum">
          {sets.length} série{sets.length > 1 ? 's' : ''}
        </div>
      </div>

      <button
        onClick={handleEnd}
        disabled={ending}
        className="w-full mt-6 py-3 rounded-xl border border-border text-muted hover:text-text"
      >
        {ending ? 'Clôture…' : 'Terminer la séance'}
      </button>

      <button
        onClick={handleDeleteWorkout}
        disabled={ending}
        className="w-full mt-3 py-2.5 rounded-xl text-muted hover:text-danger text-[13px] flex items-center justify-center gap-2"
      >
        <Trash2 size={14} strokeWidth={1.8} />
        Supprimer cette séance
      </button>
    </main>
  );
}

function StepperRow({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2.5 mt-4">
      <div className="grid grid-cols-[56px_1fr_56px] items-center h-24 bg-surface border border-border rounded-2xl">
        <button onClick={onDec} className="w-12 h-12 mx-auto rounded-xl bg-surface-2 border border-border text-[22px] active:scale-95 transition-transform">−</button>
        <span className="font-display italic text-[52px] leading-none tracking-tight tnum text-center">{value}</span>
        <button onClick={onInc} className="w-12 h-12 mx-auto rounded-xl bg-surface-2 border border-border text-[22px] active:scale-95 transition-transform">+</button>
      </div>
      <div className="flex items-center justify-center w-16 h-24 bg-surface border border-border rounded-2xl font-display italic text-[22px] text-muted">
        {label}
      </div>
    </div>
  );
}
