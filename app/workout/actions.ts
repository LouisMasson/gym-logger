'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteWorkout(workoutId: string, redirectTo?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthenticated');

  // FK sets.workout_id has ON DELETE CASCADE → series are removed automatically
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/progress');

  if (redirectTo) redirect(redirectTo);
}
