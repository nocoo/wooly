import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface SourceDetailSkeletonProps {
  /** "regular" matches the credit-card/insurance detail layout
   *  (header + stats + benefit list); "points" matches the points
   *  account layout (header + redeemables grid). Picks the right
   *  number of placeholder blocks so the skeleton's footprint
   *  approximates the loaded page. */
  variant?: "regular" | "points";
  className?: string;
}

export function SourceDetailSkeleton({
  variant = "regular",
  className,
}: SourceDetailSkeletonProps) {
  return (
    <div
      className={cn("space-y-6 md:space-y-8", className)}
      data-visual-state="loading"
    >
      {/* Header bar — back button + account card preview */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="aspect-[86/54] w-full max-w-md rounded-2xl" />
      </div>

      {/* Stat row */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: variant === "points" ? 3 : 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card bg-secondary p-4 md:p-5 space-y-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Body */}
      {variant === "regular" ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-widget bg-secondary p-3 md:p-4 space-y-2"
            >
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
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-card bg-secondary p-4 md:p-5 space-y-3"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
