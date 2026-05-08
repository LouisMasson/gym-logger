'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function deleteWorkout(workoutId: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  // FK sets.workout_id has ON DELETE CASCADE → series are removed automatically
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/progress');
}

/**
 * Reopen an ended workout for editing — sets ended_at back to NULL and redirects
 * to the active session editor. Use case: user notices a wrong set after closing
 * a session, or wants to add a forgotten exercise.
 */
export async function reopenWorkout(workoutId: string): Promise<{ redirectTo: string }> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('workouts')
    .update({ ended_at: null })
    .eq('id', workoutId);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/progress');
  revalidatePath(`/workout/${workoutId}`);
  return { redirectTo: `/session/${workoutId}` };
}

/**
 * Delete a single set from a finalized workout. Used by the in-place inline
 * fix on /workout/[id] when you spotted a typo and don't need a full reopen.
 */
export async function deleteSetFromWorkout(setId: string, workoutId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from('sets').delete().eq('id', setId);
  if (error) throw new Error(error.message);

  revalidatePath(`/workout/${workoutId}`);
  revalidatePath('/');
  revalidatePath('/progress');
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

  return { redirectTo: `/session/${created.id}` };
}
