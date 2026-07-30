import { Skeleton } from "@/components/ui/skeleton"

export default function RankingLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-24" />
        <div className="divide-y overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-20 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
