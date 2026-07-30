import { Skeleton } from "@/components/ui/skeleton"

export default function MissionsLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-52 w-full rounded-3xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <div className="overflow-hidden rounded-2xl">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton
              key={item}
              className="h-18 rounded-none border-b border-background last:border-0"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
