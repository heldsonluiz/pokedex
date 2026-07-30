"use client"

import { RouteErrorState } from "@/components/layout/route-error-state"

export default function TicketsError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <RouteErrorState
      title="Não foi possível carregar seus tickets"
      description="Verifique sua conexão e tente novamente."
      reset={reset}
    />
  )
}
