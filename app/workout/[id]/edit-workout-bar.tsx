'use client';

import { useState, useTransition } from 'react';
import { reopenWorkout, deleteSetFromWorkout } from '../actions';
import { isRedirect } from '@/lib/errors';

export function ReopenWorkoutButton({ workoutId }: { workoutId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm('Rouvrir cette séance pour la modifier ? Elle redeviendra "en cours" jusqu\'à ce que tu cliques sur Terminer à nouveau.')) return;
    startTransition(async () => {
      try {
        await reopenWorkout(workoutId);
      } catch (e) {
        if (isRedirect(e)) throw e;
        alert('Erreur : ' + (e as Error).message);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full mt-4 py-3 rounded-xl border text-[14px] font-medium"
      style={{ borderColor: 'var(--accent-dim)', color: 'var(--accent)' }}
    >
      {pending ? 'Réouverture…' : '✎ Éditer la séance'}
    </button>
  );
}

export function DeleteSetInlineButton({
  setId,
  workoutId,
}: {
  setId: string;
  workoutId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  function handleClick() {
    if (!confirm('Supprimer cette série ? Le volume de la séance sera recalculé.')) return;
    setHidden(true);
    startTransition(async () => {
      try {
        await deleteSetFromWorkout(setId, workoutId);
      } catch (e) {
        setHidden(false);
        alert('Erreur : ' + (e as Error).message);
      }
    });
  }

  if (hidden) return null;

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label="Supprimer la série"
      className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-danger active:scale-95 transition-transform"
    >
      ✕
    </button>
  );
}
