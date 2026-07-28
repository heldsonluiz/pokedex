"use client"

import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function TagsError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircle className="size-6" aria-hidden="true" />
      </span>

      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">
          Não foi possível carregar as tags
        </h1>
        <p className="text-sm text-muted-foreground">
          Verifique sua conexão com a internet e tente novamente.
        </p>
      </div>

      <Button type="button" onClick={reset}>
        Tentar novamente
      </Button>
    </section>
  )
}
