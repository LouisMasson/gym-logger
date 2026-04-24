import { Skeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-24 mb-6" />
      <Skeleton className="h-[140px] w-full mb-4" />
      <Skeleton className="h-[72px] w-full mb-2" />
      <Skeleton className="h-[72px] w-full mb-2" />
      <Skeleton className="h-[72px] w-full" />
    </main>
  );
}
