"use client"

import { RouteErrorState } from "@/components/layout/route-error-state"

export default function PassportError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <RouteErrorState
      title="Não foi possível carregar o passaporte"
      description="Verifique sua conexão e tente novamente."
      reset={reset}
    />
  )
}
