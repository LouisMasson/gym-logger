'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { duplicateWorkout } from '../actions';

export default function DuplicateWorkoutButton({
  workoutId,
  label,
}: {
  workoutId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const { redirectTo } = await duplicateWorkout(workoutId);
        router.push(redirectTo);
      } catch (e) {
        alert('Erreur : ' + (e as Error).message);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full mt-6 py-4 rounded-full font-bold text-[14px] tracking-wider uppercase"
      style={{
        background: 'var(--accent)',
        color: '#0A0B0D',
        boxShadow: '0 8px 24px rgba(212,255,61,0.25)',
      }}
    >
      {pending ? 'Création…' : `↻ Refaire "${label}"`}
    </button>
  );
}
