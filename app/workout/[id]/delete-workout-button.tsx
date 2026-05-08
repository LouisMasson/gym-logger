'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from '@/components/icons';
import { deleteWorkout } from '../actions';

export default function DeleteWorkoutButton({ workoutId, label }: { workoutId: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Supprimer "${label}" ? Toutes les séries associées seront aussi supprimées. Cette action est irréversible.`)) return;
    startTransition(async () => {
      try {
        await deleteWorkout(workoutId);
        router.push('/');
      } catch (e) {
        alert('Erreur : ' + (e as Error).message);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full mt-8 py-3 rounded-xl border border-border text-muted hover:text-danger flex items-center justify-center gap-2"
    >
      <Trash2 size={16} strokeWidth={1.8} />
      {pending ? 'Suppression…' : 'Supprimer la séance'}
    </button>
  );
}
