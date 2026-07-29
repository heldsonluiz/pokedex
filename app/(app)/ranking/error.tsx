"use client"

import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function RankingError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">
          Não foi possível carregar o ranking
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
