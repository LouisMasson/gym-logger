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
