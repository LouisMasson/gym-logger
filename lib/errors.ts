/**
 * Next.js server actions use a thrown error with digest "NEXT_REDIRECT" to signal
 * a redirect. Wrapping the call in try/catch catches this signal and presents it
 * as a real error to the user. This helper lets the redirect propagate while
 * still catching genuine errors.
 *
 * Usage in a client component:
 *   try {
 *     await someServerActionThatRedirects();
 *   } catch (e) {
 *     if (isRedirect(e)) throw e;        // let Next.js handle the redirect
 *     alert('Erreur : ' + (e as Error).message);
 *   }
 */
export function isRedirect(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}
