import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SignOutButton from '@/components/sign-out-button';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'champion';

  const { count: exercisesCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  return (
    <main className="min-h-dvh px-5 pt-16 pb-24">
      <p className="text-muted text-[13px] mb-1">Bonjour, {displayName}</p>
      <p className="label-xs">Phase 2 — Auth shell</p>

      <div className="card mt-6">
        <p className="label-xs mb-3">Volume cette semaine</p>
        <div className="flex items-baseline gap-2">
          <span className="font-display italic text-[56px] leading-none tracking-tight tnum">0</span>
          <span className="font-display italic text-[18px] text-muted">kg</span>
        </div>
        <p className="text-muted text-[13px] mt-3">
          Aucune séance logguée pour l&apos;instant. La Phase 3 ajoutera la saisie.
        </p>
      </div>

      <div className="card mt-4">
        <p className="label-xs mb-2">Bibliothèque</p>
        <p className="text-[15px]">
          <span className="font-display italic text-[28px] tnum">{exercisesCount ?? 0}</span>{' '}
          <span className="text-muted">exercices disponibles</span>
        </p>
        <p className="text-muted text-[12px] mt-2">
          Seed auto au signup. Tu peux renommer/ajouter/supprimer depuis l&apos;écran Exos (Phase 3).
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button className="btn-primary" disabled title="Phase 3">
          + Nouvelle séance
        </button>
        <SignOutButton />
      </div>

      <footer className="mt-10 text-center text-muted text-[11px]">
        Connecté en tant que {user.email}
        <br />
        Phase 2 · Auth end-to-end OK · Déployé sur gym.patronusguardian.org
      </footer>
    </main>
  );
}
