import { Skeleton } from "@/components/ui/skeleton"

export default function TalkDetailsLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando palestra"
      aria-busy="true"
    >
      <section className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full max-w-sm" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </section>
      <div className="space-y-5 rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-6 w-28" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-44 max-w-full" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-52 max-w-full" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  )
}
