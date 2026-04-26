'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function startWorkout(formData: FormData) {
  const name = ((formData.get('name') as string) || '').trim() || null;
  const user = await requireUser();
  const supabase = await createClient();

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
}): Promise<{ id: string; logged_at: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sets')
    .insert({
      user_id: user.id,
      workout_id: params.workoutId,
      exercise_id: params.exerciseId,
      set_number: params.setNumber,
      reps: params.reps,
      weight_kg: params.weightKg,
      rpe: params.rpe,
    })
    .select('id, logged_at')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Insert failed');

  revalidatePath(`/session/${params.workoutId}`);
  return { id: data.id, logged_at: data.logged_at };
}

export async function deleteSet(setId: string, workoutId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from('sets').delete().eq('id', setId);
  if (error) throw new Error(error.message);

  revalidatePath(`/session/${workoutId}`);
}

export async function endWorkout(workoutId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('workouts')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', workoutId);
  if (error) throw new Error(error.message);

  redirect('/');
}
