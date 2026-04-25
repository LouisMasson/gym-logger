import { unstable_cache, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Per-user tag for the exercises list. Invalidate via revalidateTag(exerciseListTag(userId))
 * from server actions that mutate the list (create, rename, archive, etc).
 */
export const exerciseListTag = (userId: string) => `exercises:${userId}`;

/**
 * Cached exercises list. Revalidates every 5 min OR when explicitly invalidated by tag.
 * The cache key includes userId so each user has their own cached list.
 *
 * Use case: /session/[id] reads exercises on every set logged. Without caching, that's
 * a Supabase round-trip (~50-100ms) on every page navigation. With caching, only the
 * first hit pays it; mutations from /exercises invalidate immediately via revalidateTag.
 */
export async function getCachedExercises(userId: string) {
  const cached = unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from('exercises')
        .select('id, name, muscle_group, is_favorite')
        .eq('is_archived', false)
        .order('name', { ascending: true });
      return data ?? [];
    },
    ['exercises', userId],
    {
      revalidate: 300,
      tags: [exerciseListTag(userId)],
    }
  );
  return cached();
}
