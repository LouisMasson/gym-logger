'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, TrendingUp, ListChecks } from '@/components/icons';

const items = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/session/new', label: 'Session', icon: Dumbbell, match: (p: string) => p.startsWith('/session') },
  { href: '/progress', label: 'Progression', icon: TrendingUp, match: (p: string) => p.startsWith('/progress') },
  { href: '/exercises', label: 'Exos', icon: ListChecks, match: (p: string) => p.startsWith('/exercises') },
];

export default function BottomNav() {
  const path = usePathname();
  if (path === '/login' || path.startsWith('/auth')) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 h-[72px] px-2 pt-2 pb-5 grid grid-cols-4 border-t border-border backdrop-blur-xl"
      style={{ background: 'rgba(15,17,20,0.85)' }}
    >
      {items.map(({ href, label, icon: Icon, match }) => {
        const active = match(path);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium rounded-xl transition-colors"
            style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
          >
            <Icon size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
