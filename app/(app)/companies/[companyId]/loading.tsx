import { Skeleton } from "@/components/ui/skeleton"

export default function CompanyDetailsLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando empresa"
      aria-busy="true"
    >
      <section className="flex flex-col items-center gap-4">
        <Skeleton className="size-32 rounded-3xl" />
        <Skeleton className="h-8 w-52" />
      </section>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
