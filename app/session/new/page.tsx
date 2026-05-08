'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startWorkout } from '../actions';

export default function NewSessionPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const { id } = await startWorkout(formData);
        router.push(`/session/${id}`);
      } catch (err) {
        alert('Erreur : ' + (err as Error).message);
      }
    });
  }

  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Link href="/" className="text-[15px]">←</Link>
      <h1 className="font-display italic text-[32px] tracking-tight mt-2">Nouvelle séance</h1>
      <p className="text-muted text-[14px] mt-2">Donne-lui un nom (optionnel) et démarre.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <label className="label-xs">Nom de la séance</label>
        <input
          name="name"
          placeholder="Ex: Poussée haut du corps"
          maxLength={60}
          className="bg-surface border border-border rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent-dim"
        />
        <button type="submit" disabled={pending} className="btn-primary mt-4">
          {pending ? 'Démarrage…' : 'Démarrer →'}
        </button>
      </form>
    </main>
  );
}
