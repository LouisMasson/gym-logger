import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import DeleteWorkoutButton from './delete-workout-button';
import DuplicateWorkoutButton from './duplicate-workout-button';
import { ReopenWorkoutButton, DeleteSetInlineButton } from './edit-workout-bar';

export const dynamic = 'force-dynamic';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const [workoutRes, setsRes, exosRes] = await Promise.all([
    supabase.from('workouts').select('id, name, started_at, ended_at').eq('id', id).maybeSingle(),
    supabase
      .from('sets')
      .select('id, exercise_id, set_number, reps, weight_kg, rpe, logged_at')
      .eq('workout_id', id)
      .order('logged_at', { ascending: true }),
    supabase.from('exercises').select('id, name'),
  ]);

  if (!workoutRes.data) notFound();

  const w = workoutRes.data;
  if (!w.ended_at) redirect(`/session/${id}`);

  const exoMap = new Map((exosRes.data ?? []).map((e) => [e.id, e.name]));
  const sets = setsRes.data ?? [];
  const volume = sets.reduce((acc, s) => acc + s.reps * Number(s.weight_kg ?? 0), 0);

  const byExo = new Map<string, typeof sets>();
  for (const s of sets) {
    const arr = byExo.get(s.exercise_id) ?? [];
    arr.push(s);
    byExo.set(s.exercise_id, arr);
  }

  const duration = w.ended_at
    ? Math.max(0, Math.floor((new Date(w.ended_at).getTime() - new Date(w.started_at).getTime()) / 60000))
    : 0;

  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Link href="/progress" className="text-[15px]">←</Link>
      <h1 className="font-display italic text-[32px] tracking-tight mt-1">{w.name ?? 'Séance'}</h1>
      <p className="text-muted text-[13px] mt-1 tnum">
        {new Date(w.started_at).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        {' · '}
        {duration} min
      </p>

      <div className="card mt-5 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="font-display italic text-[22px] tnum">{fmt(volume)}</div>
          <div className="label-xs mt-0.5">kg volume</div>
        </div>
        <div>
          <div className="font-display italic text-[22px] tnum">{sets.length}</div>
          <div className="label-xs mt-0.5">séries</div>
        </div>
        <div>
          <div className="font-display italic text-[22px] tnum">{byExo.size}</div>
          <div className="label-xs mt-0.5">exercices</div>
        </div>
      </div>

      {Array.from(byExo.entries()).map(([exoId, setsList]) => setsList).length === 0 && (
        <div className="card mt-6">
          <p className="text-muted text-[14px]">Aucune série loggée dans cette séance.</p>
        </div>
      )}

      {Array.from(byExo.entries()).map(([exoId, sets]) => (
        <section key={exoId} className="mt-6">
          <p className="label-xs mb-2">{exoMap.get(exoId) ?? '—'}</p>
          <div className="card p-0 overflow-hidden">
            {sets.map((s, idx) => (
              <div
                key={s.id}
                className="grid grid-cols-[24px_1fr_28px] items-center px-4 py-2.5 text-[14px]"
                style={{ borderBottom: idx === sets.length - 1 ? 'none' : '1px solid var(--border)' }}
              >
                <span className="font-mono font-semibold text-muted tnum">{s.set_number}</span>
                <span className="tnum">
                  {Number(s.weight_kg ?? 0)} kg <span className="text-muted">×</span> {s.reps}
                  {s.rpe != null && <span className="text-muted"> · RPE {s.rpe}</span>}
                </span>
                <DeleteSetInlineButton setId={s.id} workoutId={w.id} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <DuplicateWorkoutButton workoutId={w.id} label={w.name ?? 'cette séance'} />
      <ReopenWorkoutButton workoutId={w.id} />
      <DeleteWorkoutButton workoutId={w.id} label={w.name ?? 'cette séance'} />
    </main>
  );
}
