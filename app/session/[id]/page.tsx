import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import SessionEditor from './session-editor';

export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const [workoutRes, exercisesRes, setsRes] = await Promise.all([
    supabase.from('workouts').select('id, name, started_at, ended_at').eq('id', id).maybeSingle(),
    supabase.from('exercises').select('id, name, muscle_group').eq('is_archived', false).order('name'),
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
      exercises={exercisesRes.data ?? []}
      initialSets={setsRes.data ?? []}
    />
  );
}
