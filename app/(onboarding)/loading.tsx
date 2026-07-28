import { Skeleton } from "@/components/ui/skeleton"

export default function OnboardingLoading() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-8 px-6 py-8"
      aria-label="Carregando onboarding"
      aria-busy="true"
    >
      <Skeleton className="aspect-square w-full max-w-80 rounded-2xl" />

      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="mx-auto h-7 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mx-auto h-4 w-4/5" />
      </div>

      <Skeleton className="h-11 w-full" />
    </div>
  )
}
