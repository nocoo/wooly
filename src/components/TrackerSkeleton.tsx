import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matches the real TrackerPage layout while data is loading:
 * 3-col stats + 2:1 log/actions + redeemable list.
 */
export function TrackerSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6" data-visual-state="loading">
      {/* Row 1: 3 stat cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-card bg-secondary p-4 md:p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Row 2: 2:1 split (log + quick actions) */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-card bg-secondary p-4 md:p-5 space-y-4">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="md:col-span-1 rounded-card bg-secondary p-4 md:p-5 space-y-4">
          <Skeleton className="h-4 w-20" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-widget bg-secondary p-3 flex flex-col items-center gap-2"
              >
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: redeemable benefits list */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-widget bg-secondary p-3 md:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-7 w-16" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="flex-1 h-2 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
