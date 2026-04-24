import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const GROUP_LABELS: Record<string, string> = {
  push: 'Pousser',
  pull: 'Tirer',
  legs: 'Jambes',
  core: 'Core',
  other: 'Autre',
};

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, is_favorite')
    .eq('is_archived', false)
    .order('is_favorite', { ascending: false })
    .order('name', { ascending: true });

  const grouped = (exercises ?? []).reduce<Record<string, typeof exercises>>((acc, ex) => {
    const g = ex.muscle_group ?? 'other';
    (acc[g] ??= []).push(ex as never);
    return acc;
  }, {} as never);

  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-[15px]">←</Link>
      </div>
      <h1 className="font-display italic text-[32px] tracking-tight mt-1">Exercices</h1>
      <p className="text-muted text-[13px] mt-1 tnum">
        {exercises?.length ?? 0} actifs · tap pour détails (bientôt)
      </p>

      {Object.entries(GROUP_LABELS).map(([key, label]) => {
        const list = grouped[key] ?? [];
        if (list.length === 0) return null;
        return (
          <section key={key} className="mt-6">
            <p className="label-xs mb-2">{label}</p>
            <div className="card p-0 overflow-hidden">
              {list.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: idx === list.length - 1 ? 'none' : '1px solid var(--border)' }}
                >
                  <div>
                    <div className="text-[15px] font-medium">{ex.name}</div>
                    {ex.is_favorite && (
                      <div className="text-[12px] mt-0.5" style={{ color: 'var(--accent)' }}>★ favori</div>
                    )}
                  </div>
                  <span className="text-muted text-[14px]">⋯</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
