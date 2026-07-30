"use client"

import { RouteErrorState } from "@/components/layout/route-error-state"

export default function MissionsError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <RouteErrorState
      title="Não foi possível carregar as missões"
      description="Verifique sua conexão e tente novamente."
      reset={reset}
    />
  )
}
