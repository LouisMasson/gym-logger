import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  // Clone inbound headers — we will inject user identity for downstream RSC.
  const requestHeaders = new Headers(request.headers);

  // Strip any inbound x-gl-* headers — they are server-injected only.
  // Without this, an attacker hitting a path that bypasses the matcher
  // (e.g. /session/foo.png because the matcher excludes image extensions)
  // could forge x-gl-user-id and have requireUser() trust it.
  requestHeaders.delete('x-gl-user-id');
  requestHeaders.delete('x-gl-user-name');
  requestHeaders.delete('x-gl-user-email');

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = path.startsWith('/login') || path.startsWith('/auth');

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && path === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Inject user identity into request headers so RSC can read without another auth round-trip.
  // Middleware already validated the JWT against Supabase Auth — the page can trust these headers
  // because they only exist in our own internal request flow.
  if (user) {
    requestHeaders.set('x-gl-user-id', user.id);
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email?.split('@')[0] || '';
    if (name) requestHeaders.set('x-gl-user-name', encodeURIComponent(name));
    if (user.email) requestHeaders.set('x-gl-user-email', user.email);
    // Re-build response with the augmented request headers.
    const augmented = NextResponse.next({ request: { headers: requestHeaders } });
    supabaseResponse.cookies.getAll().forEach((c) => augmented.cookies.set(c.name, c.value));
    return augmented;
  }

  return supabaseResponse;
}
