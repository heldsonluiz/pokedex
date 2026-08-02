import { Skeleton } from "@/components/ui/skeleton"

export default function CompanyDetailsLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando empresa"
      aria-busy="true"
    >
      <section className="flex items-center gap-4 rounded-3xl bg-card p-5">
        <Skeleton className="size-20 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-44 max-w-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </section>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-52 rounded-3xl" />
    </div>
  )
}
