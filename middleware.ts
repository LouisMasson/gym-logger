import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

// Edge runtime shaves ~10-30ms on cold middleware boot. @supabase/ssr is
// edge-compatible (uses fetch-based API only). Falls back if any Node-only
// API sneaks in (build will fail loud).
export const runtime = 'experimental-edge';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Match only routes that need auth handling. Excludes static assets and PWA files
// so the middleware doesn't run for icon/manifest/favicon requests.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-icon|icon-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
