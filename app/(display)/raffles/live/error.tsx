"use client"

import { CircleAlert, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function RaffleLiveError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <main className="dark relative flex h-dvh items-center justify-center overflow-hidden bg-[#05020d] px-8 text-center text-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 50% 15%, rgb(124 58 237 / 45%), transparent 42%), radial-gradient(circle at 85% 85%, rgb(246 241 24 / 12%), transparent 32%)",
        }}
      />
      <section
        className="relative flex max-w-lg flex-col items-center"
        role="alert"
      >
        <span className="flex size-20 items-center justify-center rounded-full bg-destructive/15 text-destructive ring-1 ring-destructive/30">
          <CircleAlert className="size-10" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Não foi possível carregar o telão
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          O último estado do sorteio não pôde ser consultado. Verifique a
          conexão e tente novamente.
        </p>
        <Button type="button" size="lg" className="mt-6" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Tentar novamente
        </Button>
      </section>
    </main>
  )
}
