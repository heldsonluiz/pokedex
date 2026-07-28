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
        <Skeleton className="h-4 w-36" />
      </section>

      <section className="space-y-3">
        <CompanyCardSkeleton />
        <CompanyCardSkeleton />
        <CompanyCardSkeleton />
      </section>
    </div>
  )
}

function CompanyCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <Skeleton className="size-16 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40 max-w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="size-5 rounded" />
    </div>
  )
}
