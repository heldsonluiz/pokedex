import { Skeleton } from "@/components/ui/skeleton"

export default function TagsLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando tags"
      aria-busy="true"
    >
      <section className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
      </section>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <Skeleton className="h-48 rounded-3xl" />

      <section className="space-y-3">
        <Skeleton className="h-6 w-28" />
        <div className="grid grid-cols-2 gap-3">
          <TagSlotSkeleton />
          <TagSlotSkeleton />
          <TagSlotSkeleton />
          <TagSlotSkeleton />
        </div>
      </section>
    </div>
  )
}

function TagSlotSkeleton() {
  return (
    <div className="flex min-h-44 flex-col items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
      <Skeleton className="size-16 rounded-2xl" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}
