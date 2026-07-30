import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div
      className="space-y-7 px-6 py-6"
      aria-label="Carregando início"
      aria-busy="true"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>

      <Skeleton className="h-4 w-full rounded-full" />
      <Skeleton className="h-52 w-full rounded-3xl" />
      <Skeleton className="h-64 w-full rounded-3xl" />

      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="overflow-hidden rounded-2xl">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              className="h-14 rounded-none border-b border-background last:border-0"
              key={index}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
