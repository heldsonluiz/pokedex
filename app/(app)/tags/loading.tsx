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
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-1 w-full" />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <TagSlotSkeleton />
        <TagSlotSkeleton />
        <TagSlotSkeleton />
        <TagSlotSkeleton />
      </section>
    </div>
  )
}

function TagSlotSkeleton() {
  return (
    <div className="flex min-h-52 flex-col items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <Skeleton className="size-20 rounded-2xl" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}
