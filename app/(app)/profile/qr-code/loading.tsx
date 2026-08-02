import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileQrCodeLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Carregando QR Code"
      aria-busy="true"
    >
      <section className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-full" />
      </section>
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="size-64 max-w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  )
}
