import { Skeleton } from "@/components/ui/skeleton"

export default function TicketsLoading() {
  return (
    <div className="space-y-7 p-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <div className="space-y-2">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
