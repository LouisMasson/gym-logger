'use client';

import { useRef, useState, useTransition } from 'react';
import { createExercise } from './actions';

const GROUPS = [
  { key: 'push', label: 'Pousser' },
  { key: 'pull', label: 'Tirer' },
  { key: 'legs', label: 'Jambes' },
  { key: 'core', label: 'Core' },
  { key: 'other', label: 'Autre' },
] as const;

export default function NewExerciseForm() {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<(typeof GROUPS)[number]['key']>('push');
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center justify-center px-7 py-4 rounded-full font-bold text-[14px] tracking-wider uppercase w-full"
        style={{
          background: 'var(--accent)',
          color: '#0A0B0D',
          boxShadow: '0 8px 24px rgba(212,255,61,0.25)',
        }}
      >
        + Nouvel exercice
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(fd) => {
        fd.set('muscle_group', group);
        startTransition(async () => {
          try {
            await createExercise(fd);
            formRef.current?.reset();
            setOpen(false);
          } catch (e) {
            alert('Erreur : ' + (e as Error).message);
          }
        });
      }}
      className="mt-6 card flex flex-col gap-3"
    >
      <input
        name="name"
        required
        autoFocus
        placeholder="Nom de l'exercice"
        maxLength={80}
        className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-accent-dim"
      />
      <div className="flex gap-1.5 flex-wrap">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGroup(g.key)}
            className="text-[12px] uppercase tracking-wider px-3 py-1.5 rounded-full"
            style={{
              background: group === g.key ? 'var(--accent)' : 'transparent',
              color: group === g.key ? '#0A0B0D' : 'var(--muted)',
              border: group === g.key ? 'none' : '1px solid var(--border)',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2.5 rounded-lg border border-border text-muted"
        >
          Annuler
        </button>
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {pending ? 'Ajout…' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}
