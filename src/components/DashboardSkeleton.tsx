import { Skeleton } from "@/components/ui/skeleton";

/**
 * DashboardSkeleton — shown while auth is loading on /dashboard.
 * Matches the layout of DashboardPage.tsx:
 *   - 4 MetricCard placeholders
 *   - 2 chart placeholders
 *   - 4 contact card placeholders
 */
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-36 rounded-md" />
        <Skeleton className="h-4 w-56 rounded-md" />
      </div>

      {/* Metric cards — 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Charts — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border p-5 space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </div>
        <div className="rounded-xl border p-5 space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </div>
      </div>

      {/* Recent contacts — 2-column grid of 4 cards */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-36 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
