import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileQrCodeLoading() {
  return (
    <div
      className="space-y-6 px-6 py-8"
      aria-label="Carregando QR Code"
      aria-busy="true"
    >
      <section className="flex flex-col items-center space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </section>
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
        <Skeleton className="size-64 max-w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
      <Skeleton className="mx-auto h-3 w-72 max-w-full" />
    </div>
  )
}
