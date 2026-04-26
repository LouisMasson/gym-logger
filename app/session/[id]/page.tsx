import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import SessionEditor from './session-editor';

export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const [workoutRes, exercisesRes, setsRes, lastSetsRes] = await Promise.all([
    supabase.from('workouts').select('id, name, started_at, ended_at').eq('id', id).maybeSingle(),
    supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .eq('is_archived', false)
      .order('name'),
    supabase
      .from('sets')
      .select('id, exercise_id, set_number, reps, weight_kg, rpe, logged_at')
      .eq('workout_id', id)
      .order('logged_at', { ascending: true }),
    // Last set per exercise across ALL workouts — used to pre-fill the stepper
    // when the user picks an exercise. The DB function picks 1 row per exo
    // via DISTINCT ON (exercise_id) ORDER BY logged_at DESC.
    supabase.rpc('last_set_per_exercise', { p_user_id: user.id }),
  ]);
  const exercises = exercisesRes.data ?? [];

  if (!workoutRes.data) notFound();
  if (workoutRes.data.ended_at) redirect('/');

  type LastSet = { exercise_id: string; reps: number; weight_kg: number | string | null; rpe: number | null };
  const lastSets = new Map<string, { reps: number; weight: number; rpe: number | null }>();
  for (const r of (lastSetsRes.data ?? []) as LastSet[]) {
    lastSets.set(r.exercise_id, {
      reps: r.reps,
      weight: Number(r.weight_kg ?? 0),
      rpe: r.rpe,
    });
  }

  return (
    <SessionEditor
      workout={workoutRes.data}
      exercises={exercises}
      initialSets={setsRes.data ?? []}
      lastSetsByExercise={Object.fromEntries(lastSets)}
    />
  );
}
