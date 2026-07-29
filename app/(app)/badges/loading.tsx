import { Skeleton } from "@/components/ui/skeleton"

export default function BadgesLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="aspect-square rounded-full" />
        ))}
      </div>
    </div>
  )
}
