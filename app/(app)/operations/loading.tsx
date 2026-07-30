import { Skeleton } from "@/components/ui/skeleton"

export default function OperationsLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando operações"
      aria-busy="true"
    >
      <section className="space-y-2">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </section>
      <Skeleton className="h-24 w-full rounded-3xl" />
      <section className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="divide-y divide-foreground/10 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          <OperationCardSkeleton />
          <OperationCardSkeleton />
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
      </section>
      <section className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </section>
    </div>
  )
}

function OperationCardSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-card p-4">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-40 max-w-full" />
        <Skeleton className="h-4 w-32 max-w-full" />
      </div>
      <Skeleton className="size-11 shrink-0 rounded-lg" />
    </div>
  )
}
