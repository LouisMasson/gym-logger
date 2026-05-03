'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GymLogger]', error);
  }, [error]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 text-center">
      <p className="font-display italic text-[48px] leading-none" style={{ color: 'var(--accent)' }}>
        Oups
      </p>
      <p className="text-muted text-[14px] mt-3 max-w-xs">
        Une erreur est survenue lors du chargement. Ça arrive parfois au démarrage — réessaie.
      </p>
      {error.digest && (
        <p className="text-[11px] text-muted mt-2 font-mono opacity-50">{error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-8 px-6 py-3 rounded-full font-bold text-[13px] tracking-wider uppercase"
        style={{ background: 'var(--accent)', color: '#0A0B0D' }}
      >
        Réessayer
      </button>
    </main>
  );
}
