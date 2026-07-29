import { Skeleton } from "@/components/ui/skeleton"

export default function MissionsLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
      </div>
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  )
}
