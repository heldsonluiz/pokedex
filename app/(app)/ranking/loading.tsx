import { Skeleton } from "@/components/ui/skeleton"

export default function RankingLoading() {
  return (
    <div className="space-y-7 p-6" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-7 w-24" />
      {[1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  )
}
