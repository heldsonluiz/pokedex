import { Skeleton } from "@/components/ui/skeleton"

export default function ConnectionsLoading() {
  return (
    <div
      className="space-y-8 p-6"
      aria-label="Carregando conexões"
      aria-busy="true"
    >
      <section className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <ConnectionCardSkeleton />
        <ConnectionCardSkeleton />
      </section>

      <section className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <ConnectionCardSkeleton />
      </section>
    </div>
  )
}

function ConnectionCardSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-3 w-52 max-w-full" />
        </div>
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-56 max-w-full" />
    </div>
  )
}
