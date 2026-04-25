import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
};

/**
 * Reads the user identity that middleware already validated and forwarded
 * via x-gl-user-* headers. Avoids a 2nd `supabase.auth.getUser()` round-trip
 * per request (saves ~50-100ms behind a network).
 *
 * If the user is not present (shouldn't happen behind the middleware guard),
 * redirects to /login as a safety net.
 */
export async function requireUser(): Promise<SessionUser> {
  const h = await headers();
  const id = h.get('x-gl-user-id');
  if (!id) redirect('/login');
  const nameRaw = h.get('x-gl-user-name');
  const email = h.get('x-gl-user-email');
  return {
    id: id!,
    name: nameRaw ? decodeURIComponent(nameRaw) : 'champion',
    email,
  };
}
