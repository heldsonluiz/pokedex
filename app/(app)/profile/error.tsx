"use client"

import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

type ProfileErrorProps = Readonly<{
  reset: () => void
}>

export default function ProfileError({ reset }: ProfileErrorProps) {
  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircle className="size-6" aria-hidden="true" />
      </span>

      <div className="space-y-1">
        <h1 className="text-xl font-semibold">
          Não foi possível abrir o perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Verifique sua conexão e tente novamente.
        </p>
      </div>

      <Button type="button" onClick={reset}>
        Tentar novamente
      </Button>
    </section>
  )
}
