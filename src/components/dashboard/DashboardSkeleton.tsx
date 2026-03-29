import { Skeleton } from "@/components/ui/skeleton";

/** Matches the real DashboardPage layout: stat grid + 2:1 rows */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Row 1: 4 stat cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card bg-secondary p-4 md:p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Row 2: 2:1 split (list + radial) */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-card bg-secondary p-4 md:p-5 space-y-4">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3.5 w-12" />
            </div>
          ))}
        </div>
        <div className="md:col-span-1 rounded-card bg-secondary p-4 md:p-5 flex flex-col items-center gap-4">
          <Skeleton className="h-4 w-20 self-start" />
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="grid grid-cols-3 gap-4 w-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: 2:1 split (chart + list) */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-card bg-secondary p-4 md:p-5 space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-[200px] w-full rounded-widget" />
        </div>
        <div className="md:col-span-1 rounded-card bg-secondary p-4 md:p-5 space-y-4">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
