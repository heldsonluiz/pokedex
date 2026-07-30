import { Skeleton } from "@/components/ui/skeleton"

export default function TalkOperationsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
