'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { exerciseListTag } from '@/lib/cache';
import { revalidatePath, revalidateTag } from 'next/cache';

type MuscleGroup = 'push' | 'pull' | 'legs' | 'core' | 'other';

async function supabaseWithUser() {
  const user = await requireUser();
  const supabase = await createClient();
  return { supabase, userId: user.id };
}

function bust(userId: string) {
  revalidateTag(exerciseListTag(userId));
  revalidatePath('/exercises');
}

export async function createExercise(formData: FormData) {
  const name = ((formData.get('name') as string) || '').trim();
  const muscleGroup = ((formData.get('muscle_group') as MuscleGroup) || 'other');
  if (!name) throw new Error('Le nom est requis');

  const { supabase, userId } = await supabaseWithUser();
  const { error } = await supabase.from('exercises').insert({
    user_id: userId,
    name,
    muscle_group: muscleGroup,
  });
  if (error) throw new Error(error.message);

  bust(userId);
}

export async function renameExercise(id: string, newName: string) {
  const name = newName.trim();
  if (!name) throw new Error('Le nom est requis');

  const { supabase, userId } = await supabaseWithUser();
  const { error } = await supabase.from('exercises').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);

  bust(userId);
}

export async function toggleFavorite(id: string, next: boolean) {
  const { supabase, userId } = await supabaseWithUser();
  const { error } = await supabase.from('exercises').update({ is_favorite: next }).eq('id', id);
  if (error) throw new Error(error.message);
  bust(userId);
}

export async function changeMuscleGroup(id: string, group: MuscleGroup) {
  const { supabase, userId } = await supabaseWithUser();
  const { error } = await supabase.from('exercises').update({ muscle_group: group }).eq('id', id);
  if (error) throw new Error(error.message);
  bust(userId);
}

export async function archiveExercise(id: string) {
  const { supabase, userId } = await supabaseWithUser();
  const { error } = await supabase.from('exercises').update({ is_archived: true }).eq('id', id);
  if (error) throw new Error(error.message);
  bust(userId);
}
