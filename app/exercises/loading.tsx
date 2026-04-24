import { Skeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-3 w-32 mb-6" />
      <Skeleton className="h-14 w-full mb-6" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-6">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-[180px] w-full" />
        </div>
      ))}
    </main>
  );
}
