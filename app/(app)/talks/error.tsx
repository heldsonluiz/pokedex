"use client"

import { RouteErrorState } from "@/components/layout/route-error-state"

export default function TalksError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <RouteErrorState
      title="Não foi possível carregar as palestras"
      description="Confira sua conexão e tente carregar as palestras novamente."
      reset={reset}
    />
  )
}
