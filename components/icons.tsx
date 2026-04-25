type IconProps = { size?: number; strokeWidth?: number; className?: string };

const base = (size = 20, sw = 1.8) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function Home({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 12L12 4L21 12V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V12z" />
    </svg>
  );
}

export function Dumbbell({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M6 8L3 11M21 13L18 16M6.5 6.5L17.5 17.5M4 16L8 20M16 4L20 8" />
    </svg>
  );
}

export function TrendingUp({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

export function ListChecks({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 6l2 2 3-3" />
      <path d="M3 13l2 2 3-3" />
      <path d="M3 20l2 2 3-3" />
      <path d="M13 7h8" />
      <path d="M13 14h8" />
      <path d="M13 21h8" />
    </svg>
  );
}

export function Trash2({ size, strokeWidth, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
