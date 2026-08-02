"use client"

import { RouteErrorState } from "@/components/layout/route-error-state"

export default function HomeError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <RouteErrorState
      title="Não foi possível carregar o início"
      description="Verifique sua conexão e tente novamente."
      reset={reset}
    />
  )
}
