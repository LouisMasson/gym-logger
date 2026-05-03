import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import SessionEditor from './session-editor';

export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  // The RPC (last_set_per_exercise) is nice-to-have for pre-filling the stepper.
  // Run it in parallel with core queries but don't let it block the session if it fails
  // (e.g. Supabase cold start, function missing). Core queries still throw on failure.
  const [workoutRes, exercisesRes, setsRes, lastSetsSettled] = await Promise.all([
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
    // Wrapped in Promise.allSettled so a cold-start timeout or missing function
    // degrades gracefully (stepper uses defaults) rather than crashing the page.
    Promise.allSettled([supabase.rpc('last_set_per_exercise', { p_user_id: user.id })]),
  ]);
  const exercises = exercisesRes.data ?? [];

  if (!workoutRes.data) notFound();
  if (workoutRes.data.ended_at) redirect('/');

  type LastSet = { exercise_id: string; reps: number; weight_kg: number | string | null; rpe: number | null };
  const lastSets = new Map<string, { reps: number; weight: number; rpe: number | null }>();
  const rpcResult = lastSetsSettled[0];
  const rpcData = rpcResult.status === 'fulfilled' ? (rpcResult.value.data ?? []) : [];
  for (const r of rpcData as LastSet[]) {
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
