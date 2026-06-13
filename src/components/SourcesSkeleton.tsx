import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matches the real SourcesPage layout while data is loading:
 * filter row + cards grid + stats row + 3-col widget row.
 */
export function SourcesSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6" data-visual-state="loading">
      {/* Row 1: filter pills + add button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-24 rounded-md shrink-0" />
      </div>

      {/* Row 2: source cards (banking-card aspect 86:54) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-[86/54] w-full rounded-2xl"
          />
        ))}
      </div>

      {/* Row 3: stats grid (3 cards) */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-card bg-secondary p-4 md:p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Row 4: 3 widgets (radial + bar + list) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-card bg-secondary p-4 md:p-5 flex flex-col items-center gap-4">
          <Skeleton className="h-4 w-20 self-start" />
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="grid grid-cols-2 gap-4 w-full">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-card bg-secondary p-4 md:p-5 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-[180px] w-full rounded-widget" />
        </div>
        <div className="rounded-card bg-secondary p-4 md:p-5 space-y-4">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
