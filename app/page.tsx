import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '@/components/sign-out-button';

export const dynamic = 'force-dynamic';

function fmtNumber(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'champion';

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString();

  const [exoCountRes, setsWeekRes, lastWorkoutsRes] = await Promise.all([
    supabase.from('exercises').select('*', { count: 'exact', head: true }).eq('is_archived', false),
    supabase.from('sets').select('reps, weight_kg, logged_at').gte('logged_at', weekStart),
    supabase
      .from('workouts')
      .select('id, name, started_at, ended_at')
      .order('started_at', { ascending: false })
      .limit(3),
  ]);

  const weeklyVolume = (setsWeekRes.data ?? []).reduce((acc, s) => acc + (s.reps ?? 0) * Number(s.weight_kg ?? 0), 0);
  const weeklySets = setsWeekRes.data?.length ?? 0;
  const sessionsThisWeek = new Set((setsWeekRes.data ?? []).map((s) => s.logged_at.slice(0, 10))).size;

  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <p className="text-muted text-[13px]">Bonjour, {displayName}</p>
      <p className="label-xs mt-1">Semaine en cours</p>

      <div className="card mt-5">
        <p className="label-xs mb-4">Volume cette semaine</p>
        <div className="flex items-baseline gap-2">
          <span className="font-display italic text-[56px] leading-none tracking-tight tnum">
            {fmtNumber(weeklyVolume)}
          </span>
          <span className="font-display italic text-[18px] text-muted">kg</span>
        </div>
        <p className="text-muted text-[13px] mt-3 tnum">
          {sessionsThisWeek} séance{sessionsThisWeek > 1 ? 's' : ''} · {weeklySets} série{weeklySets > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex items-center justify-between mt-8 mb-2">
        <p className="label-xs">Dernières séances</p>
        <Link href="/progress" className="text-muted text-[12px]">Voir tout →</Link>
      </div>

      {(lastWorkoutsRes.data?.length ?? 0) === 0 ? (
        <div className="card">
          <p className="text-muted text-[14px]">
            Aucune séance pour l&apos;instant. Commence ta première ↓
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {lastWorkoutsRes.data!.map((w, idx) => (
            <div
              key={w.id}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: idx === lastWorkoutsRes.data!.length - 1 ? 'none' : '1px solid var(--border)' }}
            >
              <div>
                <div className="text-[15px] font-medium">{w.name ?? 'Séance'}</div>
                <div className="text-[12px] text-muted tnum">
                  {new Date(w.started_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', weekday: 'short' })}
                  {' · '}
                  {w.ended_at ? 'terminée' : 'en cours'}
                </div>
              </div>
              <span className="text-muted text-[18px]">→</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Link
          href="/session/new"
          className="inline-flex items-center justify-center px-7 py-4 rounded-full font-bold text-[14px] tracking-wider uppercase"
          style={{
            background: 'var(--accent)',
            color: '#0A0B0D',
            boxShadow: '0 8px 24px rgba(212,255,61,0.25)',
          }}
        >
          + Nouvelle séance
        </Link>
      </div>

      <div className="mt-10">
        <p className="label-xs mb-2">Bibliothèque</p>
        <Link href="/exercises" className="card block hover:border-accent-dim transition-colors">
          <p className="text-[15px]">
            <span className="font-display italic text-[28px] tnum">{exoCountRes.count ?? 0}</span>{' '}
            <span className="text-muted">exercices disponibles</span>
          </p>
          <p className="text-muted text-[12px] mt-2">Gérer les exos →</p>
        </Link>
      </div>

      <div className="mt-10">
        <SignOutButton />
      </div>
    </main>
  );
}
