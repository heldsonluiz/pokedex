import { Skeleton } from "@/components/ui/skeleton"

export default function TalksLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
