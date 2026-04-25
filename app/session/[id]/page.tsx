import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { getCachedExercises } from '@/lib/cache';
import { redirect, notFound } from 'next/navigation';
import SessionEditor from './session-editor';

export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const [workoutRes, exercises, setsRes] = await Promise.all([
    supabase.from('workouts').select('id, name, started_at, ended_at').eq('id', id).maybeSingle(),
    getCachedExercises(user.id),
    supabase
      .from('sets')
      .select('id, exercise_id, set_number, reps, weight_kg, rpe, logged_at')
      .eq('workout_id', id)
      .order('logged_at', { ascending: true }),
  ]);

  if (!workoutRes.data) notFound();
  if (workoutRes.data.ended_at) redirect('/');

  return (
    <SessionEditor
      workout={workoutRes.data}
      exercises={exercises.map((e) => ({ id: e.id, name: e.name, muscle_group: e.muscle_group }))}
      initialSets={setsRes.data ?? []}
    />
  );
}
