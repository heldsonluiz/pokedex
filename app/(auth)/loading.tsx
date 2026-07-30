import Image from "next/image"

import { Skeleton } from "@/components/ui/skeleton"

export default function LoginLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-full grid-rows-[60px_minmax(14rem,0.9fr)_auto] gap-4 px-6 pt-12 pb-[calc(2rem+env(safe-area-inset-bottom))]"
    >
      <span className="sr-only">Carregando autenticação...</span>

      <header className="flex justify-center">
        <Image
          src="/images/brand/devfest-logo.png"
          alt="DevFest Triângulo"
          width={200}
          height={62}
          className="h-auto w-48"
        />
      </header>

      <div
        aria-hidden="true"
        className="flex min-h-0 items-center justify-center"
      >
        <Skeleton className="h-4/5 min-h-52 w-full max-w-xs rounded-3xl" />
      </div>

      <div aria-hidden="true" className="flex flex-col items-center">
        <Skeleton className="h-9 w-4/5 max-w-xs" />
        <Skeleton className="mt-3 h-4 w-full max-w-sm" />
        <Skeleton className="mt-2 h-4 w-4/5 max-w-xs" />
        <Skeleton className="mt-6 h-11 w-full rounded-xl" />
        <Skeleton className="mt-4 h-3 w-4/5 max-w-xs" />
      </div>
    </div>
  )
}
