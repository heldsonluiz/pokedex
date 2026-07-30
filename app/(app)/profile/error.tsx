"use client"

import { RouteErrorState } from "@/components/layout/route-error-state"

export default function ProfileError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <RouteErrorState
      title="Não foi possível abrir o perfil"
      description="Verifique sua conexão e tente novamente."
      reset={reset}
    />
  )
}
