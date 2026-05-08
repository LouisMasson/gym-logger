import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import WorkoutRow from '@/components/workout-row';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Monday of the week containing `date` */
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── heatmap ────────────────────────────────────────────────────────────────

type HeatCell = { date: string; level: 0 | 1 | 2 | 3 | 4; volume: number; isFuture: boolean };

function buildHeatmap(volumeByDay: Map<string, number>, weeks = 12) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  const thisMonday = getMondayOf(today);
  const start = getMondayOf(new Date(thisMonday.getTime() - (weeks - 1) * 7 * 86400000));

  const allVols = Array.from(volumeByDay.values()).filter(v => v > 0);
  const maxVol = allVols.length > 0 ? Math.max(...allVols) : 1;

  function level(vol: number): 0 | 1 | 2 | 3 | 4 {
    if (vol === 0) return 0;
    const p = vol / maxVol;
    if (p <= 0.25) return 1;
    if (p <= 0.50) return 2;
    if (p <= 0.75) return 3;
    return 4;
  }

  // grid[week][dayOfWeek] — week 0 = oldest, dayOfWeek 0 = Monday
  const grid: HeatCell[][] = [];
  const monthLabels: { col: number; label: string }[] = [];

  for (let w = 0; w < weeks; w++) {
    const week: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start.getTime() + (w * 7 + d) * 86400000);
      const dateStr = toDateStr(cur);
      const vol = volumeByDay.get(dateStr) ?? 0;
      const isFuture = dateStr > todayStr;
      week.push({ date: dateStr, level: isFuture ? 0 : level(vol), volume: vol, isFuture });

      // month label on the 1st of each month (Monday row only)
      if (d === 0 && cur.getDate() <= 7) {
        monthLabels.push({
          col: w,
          label: cur.toLocaleDateString('fr-FR', { month: 'short' }),
        });
      }
    }
    grid.push(week);
  }

  return { grid, monthLabels };
}

// ─── bar chart ──────────────────────────────────────────────────────────────

function buildWeeklyBars(volumeByDay: Map<string, number>, weeks = 8) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonday = getMondayOf(today);
  const bars: { label: string; volume: number; isCurrent: boolean }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const monday = new Date(thisMonday.getTime() - i * 7 * 86400000);
    let volume = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday.getTime() + d * 86400000);
      volume += volumeByDay.get(toDateStr(day)) ?? 0;
    }
    bars.push({
      label: i === 0 ? 'S' : `-${i}`,
      volume,
      isCurrent: i === 0,
    });
  }
  return bars;
}

// ─── cell colors ────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: '#1F2226',          // --surface-2, rest day
  1: '#2a3510',          // dark olive – light session
  2: '#3d5219',          // medium olive
  3: '#7A9322',          // --accent-dim
  4: '#D4FF3D',          // --accent, intense day
};

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
// only show Mon / Wed / Fri to keep it uncluttered
const SHOW_DAY_LABEL = [true, false, true, false, true, false, false];

// ─── page ───────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  await requireUser();
  const supabase = await createClient();

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

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

  // volume per day
  const volumeByDay = new Map<string, number>();
  for (const s of sets) {
    const day = s.logged_at.slice(0, 10);
    volumeByDay.set(day, (volumeByDay.get(day) ?? 0) + s.reps * Number(s.weight_kg ?? 0));
  }

  const totalVolume = sets.reduce((acc, s) => acc + s.reps * Number(s.weight_kg ?? 0), 0);

  const prByExo = new Map<string, { weight: number; reps: number; date: string }>();
  for (const s of sets) {
    const w = Number(s.weight_kg ?? 0);
    const cur = prByExo.get(s.exercise_id);
    if (!cur || w > cur.weight || (w === cur.weight && s.reps > cur.reps)) {
      prByExo.set(s.exercise_id, { weight: w, reps: s.reps, date: s.logged_at });
    }
  }
  const prs = Array.from(prByExo.entries())
    .map(([id, v]) => ({ name: exoMap.get(id) ?? '—', ...v }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  const { grid, monthLabels } = buildHeatmap(volumeByDay, 12);
  const weeklyBars = buildWeeklyBars(volumeByDay, 8);
  const maxBarVol = Math.max(...weeklyBars.map(b => b.volume), 1);

  // count active days from heatmap
  const activeDays = grid.flat().filter(c => c.level > 0).length;

  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Link href="/" className="text-[15px]">←</Link>
      <h1 className="font-display italic text-[32px] tracking-tight mt-1">Progression</h1>
      <p className="text-muted text-[13px] mt-1">12 dernières semaines</p>

      {/* ── Heatmap ─────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="label-xs">Régularité</p>
          <p className="text-[11px] text-muted tnum">{activeDays} jour{activeDays > 1 ? 's' : ''} actif{activeDays > 1 ? 's' : ''}</p>
        </div>

        <div
          className="card overflow-x-auto"
          style={{ padding: '12px 14px' }}
        >
          {/* month labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '14px repeat(12, 1fr)',
              gap: '3px',
              marginBottom: '4px',
            }}
          >
            <div /> {/* spacer for day-label column */}
            {Array.from({ length: 12 }, (_, w) => {
              const ml = monthLabels.find(m => m.col === w);
              return (
                <div
                  key={w}
                  style={{
                    fontSize: '9px',
                    color: 'var(--muted)',
                    textTransform: 'capitalize',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    minHeight: '10px',
                  }}
                >
                  {ml?.label ?? ''}
                </div>
              );
            })}
          </div>

          {/* grid rows: one per day of week */}
          {Array.from({ length: 7 }, (_, dayIdx) => (
            <div
              key={dayIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: '14px repeat(12, 1fr)',
                gap: '3px',
                marginBottom: dayIdx < 6 ? '3px' : 0,
              }}
            >
              {/* day label */}
              <div
                style={{
                  fontSize: '9px',
                  color: SHOW_DAY_LABEL[dayIdx] ? 'var(--muted)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: 1,
                }}
              >
                {DAY_LABELS[dayIdx]}
              </div>

              {/* cells for this day across 12 weeks */}
              {grid.map((week, wIdx) => {
                const cell = week[dayIdx];
                return (
                  <div
                    key={wIdx}
                    title={
                      cell.volume > 0
                        ? `${cell.date} — ${fmt(cell.volume)} kg`
                        : cell.isFuture
                          ? ''
                          : cell.date
                    }
                    style={{
                      aspectRatio: '1',
                      borderRadius: '3px',
                      background: cell.isFuture ? 'transparent' : LEVEL_COLORS[cell.level],
                    }}
                  />
                );
              })}
            </div>
          ))}

          {/* legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '10px',
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ fontSize: '9px', color: 'var(--muted)' }}>Moins</span>
            {([0, 1, 2, 3, 4] as const).map(l => (
              <div
                key={l}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: LEVEL_COLORS[l],
                }}
              />
            ))}
            <span style={{ fontSize: '9px', color: 'var(--muted)' }}>Plus</span>
          </div>
        </div>
      </div>

      {/* ── Volume par semaine ──────────────────────────────────────────── */}
      <div className="card mt-4">
        <p className="label-xs mb-4">Volume par semaine</p>
        <div className="flex items-end gap-[6px]" style={{ height: '56px' }}>
          {weeklyBars.map((bar, i) => {
            const heightPx = bar.volume > 0
              ? Math.max(Math.round((bar.volume / maxBarVol) * 48), 4)
              : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-[5px]">
                <div
                  style={{
                    width: '100%',
                    height: `${heightPx}px`,
                    borderRadius: '3px 3px 0 0',
                    background: bar.isCurrent
                      ? 'var(--accent)'
                      : 'rgba(212,255,61,0.28)',
                    transition: 'height 0.2s ease',
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* week labels */}
        <div className="flex gap-[6px] mt-[6px]">
          {weeklyBars.map((bar, i) => (
            <div
              key={i}
              className="flex-1 text-center tnum"
              style={{
                fontSize: '9px',
                color: bar.isCurrent ? 'var(--accent)' : 'var(--muted)',
                fontWeight: bar.isCurrent ? 600 : 400,
              }}
            >
              {bar.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats globales ──────────────────────────────────────────────── */}
      <div className="card mt-4">
        <p className="label-xs">Volume total (90j)</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-display italic text-[48px] leading-none tnum">{fmt(totalVolume)}</span>
          <span className="text-muted text-[14px]">kg</span>
        </div>
        <p className="text-muted text-[12px] mt-2 tnum">
          {sets.length} série{sets.length > 1 ? 's' : ''} · {workoutsRes.data?.length ?? 0} séance{(workoutsRes.data?.length ?? 0) > 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Records ─────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <p className="label-xs mb-2">Records (charge max / exo)</p>
        {prs.length === 0 ? (
          <div className="card">
            <p className="text-muted text-[14px]">Aucune série loggée.</p>
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

      {/* ── Séances récentes ────────────────────────────────────────────── */}
      <div className="mt-6">
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
