import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ExerciseRow from './exercise-row';
import NewExerciseForm from './new-exercise-form';

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

  const list = exercises ?? [];
  const grouped: Record<string, typeof list> = {};
  for (const ex of list) {
    const g = ex.muscle_group ?? 'other';
    (grouped[g] ??= []).push(ex);
  }

  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Link href="/" className="text-[15px]">←</Link>
      <h1 className="font-display italic text-[32px] tracking-tight mt-1">Exercices</h1>
      <p className="text-muted text-[13px] mt-1 tnum">
        {list.length} actifs · tap le nom pour renommer, ★ pour favori
      </p>

      <NewExerciseForm />

      {Object.entries(GROUP_LABELS).map(([key, label]) => {
        const items = grouped[key] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={key} className="mt-6">
            <p className="label-xs mb-2">{label} <span className="tnum">({items.length})</span></p>
            <div className="card p-0 overflow-hidden">
              {items.map((ex, idx) => (
                <ExerciseRow key={ex.id} exercise={ex} isLast={idx === items.length - 1} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
