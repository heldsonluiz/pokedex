import { Skeleton } from "@/components/ui/skeleton"

export default function CompaniesLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando empresas"
      aria-busy="true"
    >
      <section className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full" />
      </section>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-44 rounded-3xl" />
      </div>

      <section className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <div className="divide-y overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          <CompanyCardSkeleton />
          <CompanyCardSkeleton />
          <CompanyCardSkeleton />
        </div>
      </section>
    </div>
  )
}

function CompanyCardSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-3">
      <Skeleton className="size-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-8 w-12 rounded" />
    </div>
  )
}
