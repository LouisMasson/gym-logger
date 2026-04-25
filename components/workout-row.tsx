'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Trash2 } from '@/components/icons';
import { deleteWorkout } from '@/app/workout/actions';

export type WorkoutRowData = {
  id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
};

export default function WorkoutRow({
  w,
  isLast,
  size = 'md',
}: {
  w: WorkoutRowData;
  isLast: boolean;
  size?: 'sm' | 'md';
}) {
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const label = w.name ?? 'cette séance';
    if (!confirm(`Supprimer "${label}" ? Toutes les séries associées seront aussi supprimées. Cette action est irréversible.`)) return;
    setDeleting(true);
    startTransition(async () => {
      try {
        await deleteWorkout(w.id);
      } catch (err) {
        setDeleting(false);
        alert('Erreur : ' + (err as Error).message);
      }
    });
  }

  const href = w.ended_at ? `/workout/${w.id}` : `/session/${w.id}`;
  const titleSize = size === 'sm' ? 'text-[14px]' : 'text-[15px]';
  const subSize = size === 'sm' ? 'text-[11px]' : 'text-[12px]';

  return (
    <div
      className="flex items-center px-4 py-3 transition-opacity"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        opacity: deleting || pending ? 0.4 : 1,
      }}
    >
      <Link href={href} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <div className={`${titleSize} font-medium truncate`}>{w.name ?? 'Séance'}</div>
        <div className={`${subSize} text-muted tnum`}>
          {new Date(w.started_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', weekday: 'short' })}
          {' · '}
          {w.ended_at ? 'terminée' : <span style={{ color: 'var(--accent)' }}>en cours</span>}
        </div>
      </Link>
      <button
        onClick={handleDelete}
        disabled={pending}
        aria-label="Supprimer la séance"
        className="ml-2 w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:text-danger active:scale-95 transition-all"
      >
        <Trash2 size={16} strokeWidth={1.8} />
      </button>
    </div>
  );
}
