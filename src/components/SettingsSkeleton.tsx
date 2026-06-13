import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matches the real SettingsPage layout while data is loading:
 * left nav (4 items) + right content panel.
 */
export function SettingsSkeleton() {
  return (
    <div
      className="grid gap-4 md:gap-6 lg:grid-cols-4"
      data-visual-state="loading"
    >
      {/* Left nav */}
      <nav className="lg:col-span-1">
        <div className="rounded-card bg-secondary p-2 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-widget px-3 py-2"
            >
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </nav>

      {/* Right content panel */}
      <div className="lg:col-span-3">
        <div className="rounded-card bg-secondary p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-24" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-widget bg-secondary p-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
