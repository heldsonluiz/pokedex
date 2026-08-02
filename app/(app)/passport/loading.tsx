import { Skeleton } from "@/components/ui/skeleton"

export default function PassportLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-52 w-full rounded-3xl" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  )
}
