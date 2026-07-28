import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <main
      className="mx-auto w-full max-w-3xl space-y-6 p-6"
      aria-label="Carregando perfil"
      aria-busy="true"
    >
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>

      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </main>
  )
}
