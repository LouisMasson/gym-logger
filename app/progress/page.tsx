import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import WorkoutRow from '@/components/workout-row';

export const dynamic = 'force-dynamic';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const [setsRes, workoutsRes, exoMapRes] = await Promise.all([
    supabase
      .from('sets')
      .select('reps, weight_kg, logged_at, exercise_id')
      .gte('logged_at', threeMonthsAgo.toISOString()),
    supabase
      .from('workouts')
      .select('id, name, started_at, ended_at')
      .gte('started_at', threeMonthsAgo.toISOString())
      .order('started_at', { ascending: false }),
    supabase.from('exercises').select('id, name'),
  ]);

  const exoMap = new Map((exoMapRes.data ?? []).map((e) => [e.id, e.name]));
  const sets = setsRes.data ?? [];

  const totalVolume = sets.reduce((acc, s) => acc + s.reps * Number(s.weight_kg ?? 0), 0);

  const prByExo = new Map<string, { weight: number; reps: number; date: string }>();
  for (const s of sets) {
    const w = Number(s.weight_kg ?? 0);
    const current = prByExo.get(s.exercise_id);
    if (!current || w > current.weight || (w === current.weight && s.reps > current.reps)) {
      prByExo.set(s.exercise_id, { weight: w, reps: s.reps, date: s.logged_at });
    }
  }
  const prs = Array.from(prByExo.entries())
    .map(([id, v]) => ({ name: exoMap.get(id) ?? '—', ...v }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Link href="/" className="text-[15px]">←</Link>
      <h1 className="font-display italic text-[32px] tracking-tight mt-1">Progression</h1>
      <p className="text-muted text-[13px] mt-1">90 derniers jours</p>

      <div className="card mt-6">
        <p className="label-xs">Volume total</p>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="font-display italic text-[48px] leading-none tnum">{fmt(totalVolume)}</span>
          <span className="text-muted text-[14px]">kg</span>
        </div>
        <p className="text-muted text-[12px] mt-2 tnum">
          {sets.length} série{sets.length > 1 ? 's' : ''} · {workoutsRes.data?.length ?? 0} séance{(workoutsRes.data?.length ?? 0) > 1 ? 's' : ''}
        </p>
      </div>

      <div className="mt-8">
        <p className="label-xs mb-2">Records (charge max / exo)</p>
        {prs.length === 0 ? (
          <div className="card">
            <p className="text-muted text-[14px]">Aucune série loggée. Commence une séance ↓</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {prs.map((pr, idx) => (
              <div
                key={pr.name + idx}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: idx === prs.length - 1 ? 'none' : '1px solid var(--border)' }}
              >
                <div>
                  <div className="text-[14px] font-medium">{pr.name}</div>
                  <div className="text-[11px] text-muted tnum">
                    {new Date(pr.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="font-display italic text-[22px] tnum">
                  {pr.weight}
                  <span className="text-muted text-[13px] ml-1">kg × {pr.reps}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="label-xs mb-2">Séances récentes</p>
        {(workoutsRes.data?.length ?? 0) === 0 ? (
          <div className="card">
            <p className="text-muted text-[14px]">Aucune séance.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {workoutsRes.data!.slice(0, 10).map((w, idx, arr) => (
              <WorkoutRow key={w.id} w={w} isLast={idx === arr.length - 1} size="sm" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
