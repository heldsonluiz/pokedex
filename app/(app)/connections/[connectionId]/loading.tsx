import { Skeleton } from "@/components/ui/skeleton"

export default function ConnectedProfileLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando perfil da conexão"
      aria-busy="true"
    >
      <section className="flex flex-col items-center rounded-3xl bg-card p-6">
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="mt-4 h-8 w-52 max-w-full" />
        <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      </section>

      <section className="divide-y divide-foreground/10 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-44 max-w-full" />
            </div>
          </div>
        ))}
      </section>

      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}
