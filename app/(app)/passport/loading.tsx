import { Skeleton } from "@/components/ui/skeleton"

export default function PassportLoading() {
  return (
    <div className="space-y-7 p-6" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}
