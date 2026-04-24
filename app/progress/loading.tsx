import { Skeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-3 w-32 mb-6" />
      <Skeleton className="h-[110px] w-full mb-6" />
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-[240px] w-full mb-6" />
      <Skeleton className="h-[200px] w-full" />
    </main>
  );
}
