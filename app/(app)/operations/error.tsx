"use client"

import { RouteErrorState } from "@/components/layout/route-error-state"

export default function OperationsError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <RouteErrorState
      title="Não foi possível carregar as operações"
      description="Verifique sua conexão antes de tentar acessar novamente os controles administrativos."
      reset={reset}
    />
  )
}
