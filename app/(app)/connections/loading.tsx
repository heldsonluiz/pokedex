import { Skeleton } from "@/components/ui/skeleton"

export default function ConnectionsLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando conexões"
      aria-busy="true"
    >
      <section className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </section>

      <Skeleton className="h-48 rounded-3xl" />

      <section className="space-y-3">
        <Skeleton className="h-6 w-28" />
        <div className="divide-y overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          <ConnectionCardSkeleton />
          <ConnectionCardSkeleton />
          <ConnectionCardSkeleton />
        </div>
      </section>
    </div>
  )
}

function ConnectionCardSkeleton() {
  return (
    <div className="bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-3 w-32 max-w-full" />
        </div>
        <Skeleton className="size-10 rounded-lg" />
      </div>
    </div>
  )
}
