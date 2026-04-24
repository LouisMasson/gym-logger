export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'var(--surface-2)', ...style }}
    />
  );
}

export function PageHeader({ back = true, title, sub }: { back?: boolean; title: string; sub?: string }) {
  return (
    <>
      {back && <div className="h-5 w-5 mb-1 opacity-50">←</div>}
      <h1 className="font-display italic text-[32px] tracking-tight mt-1">{title}</h1>
      {sub && <p className="text-muted text-[13px] mt-1">{sub}</p>}
    </>
  );
}
