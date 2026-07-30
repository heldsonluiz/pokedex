import { Skeleton } from "@/components/ui/skeleton"

export default function EditProfileLoading() {
  return (
    <div
      className="space-y-6 p-4 px-8"
      aria-label="Carregando edição do perfil"
      aria-busy="true"
    >
      <section className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </section>
      <div className="space-y-5">
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  )
}
