"use client"

import { RouteErrorState } from "@/components/layout/route-error-state"

export default function TagsError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <RouteErrorState
      title="Não foi possível carregar as tags"
      description="Verifique sua conexão com a internet e tente novamente."
      reset={reset}
    />
  )
}
