import { SkeletonLine } from "@nocoo/basalt/components/skeleton-line";
import { LayerCard } from "@nocoo/basalt";
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
        <SkeletonLine
          className="h-8 w-24 rounded-md"
          style={{ width: undefined }}
        />
        <SkeletonLine
          className="aspect-[86/54] h-auto w-full max-w-md rounded-2xl"
          style={{ width: undefined }}
        />
      </div>

      {/* Stat row */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: variant === "points" ? 3 : 4 }).map((_, i) => (
          <LayerCard key={i} className="p-4 md:p-5 space-y-3">
            <SkeletonLine className="h-3 w-20" style={{ width: undefined }} />
            <SkeletonLine className="h-7 w-16" style={{ width: undefined }} />
          </LayerCard>
        ))}
      </div>

      {/* Body */}
      {variant === "regular" ? (
        <div className="space-y-3">
          <SkeletonLine className="h-4 w-32" style={{ width: undefined }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <LayerCard.Well key={i} className="p-3 md:p-4 space-y-2">
              <div className="flex items-center justify-between">
                <SkeletonLine
                  className="h-4 w-48"
                  style={{ width: undefined }}
                />
                <SkeletonLine
                  className="h-7 w-16"
                  style={{ width: undefined }}
                />
              </div>
              <div className="flex items-center gap-3">
                <SkeletonLine
                  className="h-2 flex-1 rounded-full"
                  style={{ width: undefined }}
                />
                <SkeletonLine
                  className="h-3 w-12"
                  style={{ width: undefined }}
                />
              </div>
            </LayerCard.Well>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LayerCard key={i} className="p-4 md:p-5 space-y-3">
              <SkeletonLine
                className="h-4 w-3/4"
                style={{ width: undefined }}
              />
              <SkeletonLine
                className="h-3 w-1/2"
                style={{ width: undefined }}
              />
              <SkeletonLine
                className="h-8 w-24"
                style={{ width: undefined }}
              />
            </LayerCard>
          ))}
        </div>
      )}
    </div>
  );
}
