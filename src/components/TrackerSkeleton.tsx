import { SkeletonLine } from "@nocoo/basalt/components/skeleton-line";
import { LayerCard } from "@nocoo/basalt";

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
          <LayerCard key={i} className="p-4 md:p-5 space-y-3">
            <SkeletonLine className="h-3 w-20" style={{ width: undefined }} />
            <SkeletonLine className="h-7 w-16" style={{ width: undefined }} />
          </LayerCard>
        ))}
      </div>

      {/* Row 2: 2:1 split (log + quick actions) */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <LayerCard className="md:col-span-2 p-4 md:p-5 space-y-4">
          <SkeletonLine className="h-4 w-24" style={{ width: undefined }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonLine
                className="h-8 w-8 shrink-0 rounded-lg"
                style={{ width: undefined }}
              />
              <div className="flex-1 space-y-1.5">
                <SkeletonLine
                  className="h-3.5 w-3/4"
                  style={{ width: undefined }}
                />
                <SkeletonLine
                  className="h-3 w-1/2"
                  style={{ width: undefined }}
                />
              </div>
            </div>
          ))}
        </LayerCard>
        <LayerCard className="md:col-span-1 p-4 md:p-5 space-y-4">
          <SkeletonLine className="h-4 w-20" style={{ width: undefined }} />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <LayerCard.Well
                key={i}
                className="p-3 flex flex-col items-center gap-2"
              >
                <SkeletonLine
                  className="h-9 w-9 rounded-lg"
                  style={{ width: undefined }}
                />
                <SkeletonLine
                  className="h-3 w-12"
                  style={{ width: undefined }}
                />
              </LayerCard.Well>
            ))}
          </div>
        </LayerCard>
      </div>

      {/* Row 3: redeemable benefits list */}
      <div className="space-y-3">
        <SkeletonLine className="h-4 w-32" style={{ width: undefined }} />
        {Array.from({ length: 4 }).map((_, i) => (
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
              <SkeletonLine className="h-3 w-12" style={{ width: undefined }} />
            </div>
          </LayerCard.Well>
        ))}
      </div>
    </div>
  );
}
