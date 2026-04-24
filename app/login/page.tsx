'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();

  async function signInWithGoogle() {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="min-h-dvh flex flex-col px-6 pt-24 pb-10">
      <div className="flex-1">
        <h1 className="font-display italic text-[64px] leading-[0.95] tracking-tight">
          Gym<br />Logger.
        </h1>
        <p className="text-muted mt-4 text-[17px] max-w-[280px] leading-[1.4]">
          Logge ta perf.<br />Rien d&apos;autre.
        </p>
      </div>

      <div>
        <button
          onClick={signInWithGoogle}
          className="oauth-btn"
          aria-label="Continuer avec Google"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 5c1.617 0 3.077.557 4.228 1.65l3.15-3.15C17.46 1.72 14.97.7 12 .7 7.392.7 3.397 3.34 1.388 7.18l3.67 2.848C6.037 7.043 8.786 5 12 5z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.74-2.4 3.58l3.68 2.87c2.15-1.98 3.39-4.9 3.39-8.69z"/>
            <path fill="#FBBC05" d="M5.06 14.3c-.19-.58-.3-1.2-.3-1.83s.11-1.25.3-1.83L1.39 7.79C.5 9.55 0 11.51 0 13.47c0 1.96.5 3.92 1.39 5.68l3.67-2.85z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.68-2.87c-1.02.69-2.33 1.1-4.25 1.1-3.21 0-5.95-2.04-6.94-4.97l-3.67 2.85C3.4 20.66 7.39 24 12 24z"/>
          </svg>
          Continuer avec Google
        </button>

        <p className="text-center text-muted text-xs mt-8 leading-[1.5]">
          Pas de compte ? Connecte-toi,<br />
          on crée le tien automatiquement.
        </p>
      </div>
    </main>
  );
}
