'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteWorkout(workoutId: string, redirectTo?: string) {
  await requireUser();
  const supabase = await createClient();

  // FK sets.workout_id has ON DELETE CASCADE → series are removed automatically
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/progress');

  if (redirectTo) redirect(redirectTo);
}

/**
 * Create a new workout that clones the source's name. Sets are NOT copied —
 * a new workout starts fresh; the user re-logs sets. The session editor will
 * pre-fill the stepper from the previous values automatically (last_set_per_exercise),
 * so the friction is near-zero.
 */
export async function duplicateWorkout(sourceWorkoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: source, error: srcErr } = await supabase
    .from('workouts')
    .select('name')
    .eq('id', sourceWorkoutId)
    .maybeSingle();
  if (srcErr || !source) {
    throw new Error(srcErr?.message ?? 'Séance source introuvable');
  }

  const { data: created, error: insErr } = await supabase
    .from('workouts')
    .insert({ user_id: user.id, name: source.name })
    .select('id')
    .single();
  if (insErr || !created) {
    throw new Error(insErr?.message ?? 'Impossible de dupliquer la séance');
  }

  redirect(`/session/${created.id}`);
}
