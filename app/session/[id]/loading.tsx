import { Skeleton } from '@/components/skeleton';

export default function Loading() {
  return (
    <main className="min-h-dvh px-5 pt-14 pb-28">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-14 w-full mt-5" />
      <Skeleton className="h-8 w-48 mt-5" />
      <Skeleton className="h-24 w-full mt-4" />
      <Skeleton className="h-24 w-full mt-3" />
      <Skeleton className="h-6 w-full mt-5" />
      <Skeleton className="h-14 w-full mt-6" />
    </main>
  );
}
