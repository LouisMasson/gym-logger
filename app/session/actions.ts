'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function startWorkout(formData: FormData) {
  const name = ((formData.get('name') as string) || '').trim() || null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: user.id, name })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Impossible de démarrer la séance');
  }

  redirect(`/session/${data.id}`);
}

export async function logSet(params: {
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe: number | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthenticated');

  const { error } = await supabase.from('sets').insert({
    user_id: user.id,
    workout_id: params.workoutId,
    exercise_id: params.exerciseId,
    set_number: params.setNumber,
    reps: params.reps,
    weight_kg: params.weightKg,
    rpe: params.rpe,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/session/${params.workoutId}`);
}

export async function deleteSet(setId: string, workoutId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthenticated');

  const { error } = await supabase.from('sets').delete().eq('id', setId);
  if (error) throw new Error(error.message);

  revalidatePath(`/session/${workoutId}`);
}

export async function endWorkout(workoutId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthenticated');

  const { error } = await supabase
    .from('workouts')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', workoutId);
  if (error) throw new Error(error.message);

  redirect('/');
}
