import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function publicOrigin(request: Request): string {
  const h = request.headers;
  const forwardedHost = h.get('x-forwarded-host');
  const forwardedProto = h.get('x-forwarded-proto');
  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`;
  }
  const host = h.get('host');
  if (host) {
    const proto = forwardedProto || (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/';
  // Reject any next that could escape the origin (//evil.com, /\evil.com, full URLs).
  const safeNext =
    nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\')
      ? nextParam
      : '/';
  const origin = publicOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
}
