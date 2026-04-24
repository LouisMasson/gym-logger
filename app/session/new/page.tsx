import { startWorkout } from '../actions';
import Link from 'next/link';

export default function NewSessionPage() {
  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Link href="/" className="text-[15px]">←</Link>
      <h1 className="font-display italic text-[32px] tracking-tight mt-2">Nouvelle séance</h1>
      <p className="text-muted text-[14px] mt-2">Donne-lui un nom (optionnel) et démarre.</p>

      <form action={startWorkout} className="mt-8 flex flex-col gap-3">
        <label className="label-xs">Nom de la séance</label>
        <input
          name="name"
          placeholder="Ex: Poussée haut du corps"
          maxLength={60}
          className="bg-surface border border-border rounded-xl px-4 py-3 text-[15px] outline-none focus:border-accent-dim"
        />
        <button type="submit" className="btn-primary mt-4">Démarrer →</button>
      </form>
    </main>
  );
}
