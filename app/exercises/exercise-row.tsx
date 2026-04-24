'use client';

import { useState, useTransition } from 'react';
import { renameExercise, toggleFavorite, changeMuscleGroup, archiveExercise } from './actions';

type MuscleGroup = 'push' | 'pull' | 'legs' | 'core' | 'other';
const GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'push', label: 'Pousser' },
  { key: 'pull', label: 'Tirer' },
  { key: 'legs', label: 'Jambes' },
  { key: 'core', label: 'Core' },
  { key: 'other', label: 'Autre' },
];

export default function ExerciseRow({
  exercise,
  isLast,
}: {
  exercise: { id: string; name: string; muscle_group: string | null; is_favorite: boolean };
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [pending, startTransition] = useTransition();

  function handleRename() {
    if (name.trim() === exercise.name || !name.trim()) {
      setEditing(false);
      setName(exercise.name);
      return;
    }
    startTransition(async () => {
      try {
        await renameExercise(exercise.id, name);
        setEditing(false);
      } catch (e) {
        alert('Erreur : ' + (e as Error).message);
        setName(exercise.name);
        setEditing(false);
      }
    });
  }

  function handleFavorite() {
    startTransition(async () => {
      try { await toggleFavorite(exercise.id, !exercise.is_favorite); }
      catch (e) { alert('Erreur : ' + (e as Error).message); }
    });
  }

  function handleArchive() {
    if (!confirm(`Supprimer "${exercise.name}" ? Les séries déjà loggées restent conservées.`)) return;
    startTransition(async () => {
      try { await archiveExercise(exercise.id); }
      catch (e) { alert('Erreur : ' + (e as Error).message); }
    });
  }

  function handleGroupChange(g: MuscleGroup) {
    startTransition(async () => {
      try { await changeMuscleGroup(exercise.id, g); }
      catch (e) { alert('Erreur : ' + (e as Error).message); }
    });
  }

  return (
    <div
      className="px-4 py-3"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', opacity: pending ? 0.5 : 1 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') { setName(exercise.name); setEditing(false); }
              }}
              className="w-full bg-surface-2 border border-accent-dim rounded-lg px-2 py-1 text-[15px] font-medium outline-none"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-[15px] font-medium text-left w-full truncate"
            >
              {exercise.name}
            </button>
          )}
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            {GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => handleGroupChange(g.key)}
                className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  background: exercise.muscle_group === g.key ? 'var(--accent)' : 'transparent',
                  color: exercise.muscle_group === g.key ? '#0A0B0D' : 'var(--muted)',
                  border: exercise.muscle_group === g.key ? 'none' : '1px solid var(--border)',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFavorite}
            aria-label="Favori"
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ color: exercise.is_favorite ? 'var(--accent)' : 'var(--muted)' }}
          >
            {exercise.is_favorite ? '★' : '☆'}
          </button>
          <button
            onClick={handleArchive}
            aria-label="Supprimer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-danger"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
