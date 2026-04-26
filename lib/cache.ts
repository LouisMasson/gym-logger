/**
 * Per-user tag for the exercises list. Kept exported because the CRUD actions
 * call revalidateTag(exerciseListTag(userId)). Even though the cache wrapper
 * was removed (Next.js forbids cookies inside unstable_cache), we keep the
 * tag so re-introducing a non-cookie cached client later is a one-liner.
 */
export const exerciseListTag = (userId: string) => `exercises:${userId}`;
