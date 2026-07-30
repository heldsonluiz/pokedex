"use client"

import { CircleAlert, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

type RouteErrorStateProps = Readonly<{
  title: string
  description: string
  reset: () => void
}>

export function RouteErrorState({
  title,
  description,
  reset,
}: RouteErrorStateProps) {
  return (
    <section
      className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center"
      role="alert"
    >
      <span className="rounded-full bg-destructive/10 p-4 text-destructive">
        <CircleAlert className="size-8" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <Button type="button" variant="outline" onClick={reset}>
        <RotateCcw aria-hidden="true" />
        Tentar novamente
      </Button>
    </section>
  )
}
