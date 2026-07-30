import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div
      className="space-y-8 px-6 py-6"
      aria-label="Carregando início"
      aria-busy="true"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>

      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-lg" />

      <div className="space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-[74px] rounded-2xl" key={index} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="col-span-2 h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
