import { Skeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Skeleton className="h-5 w-5 mb-1" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-3 w-64 mb-6" />
      <Skeleton className="h-20 w-full mb-6" />
      <Skeleton className="h-[140px] w-full mb-4" />
      <Skeleton className="h-[140px] w-full" />
    </main>
  );
}
