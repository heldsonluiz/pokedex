import { Skeleton } from "@/components/ui/skeleton"

export default function TicketsLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-52 rounded-3xl" />
      <Skeleton className="h-72 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="divide-y overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-16 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
