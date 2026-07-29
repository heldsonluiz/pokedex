"use client"

import { LoaderCircle, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

import {
  processRaffleClosureBatchAndNotify,
  processRaffleSimulationBatchAndNotify,
} from "./raffle-live.actions-client"

export function RaffleAutoProcessor({
  mode,
  processedParticipants,
}: Readonly<{
  mode: "closure" | "simulation"
  processedParticipants: number
}>) {
  const router = useRouter()
  const startedKey = useRef<string | null>(null)
  const [error, setError] = useState(false)
  const key = `${mode}:${processedParticipants}`

  useEffect(() => {
    if (startedKey.current === key || error) {
      return
    }

    startedKey.current = key
    const processBatch =
      mode === "simulation"
        ? processRaffleSimulationBatchAndNotify
        : processRaffleClosureBatchAndNotify

    void processBatch()
      .then(() => router.refresh())
      .catch(() => setError(true))
  }, [error, key, mode, router])

  if (error) {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm text-destructive">
          O processamento foi interrompido. O último lote concluído foi
          preservado.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            startedKey.current = null
            setError(false)
          }}
        >
          <RotateCcw aria-hidden="true" />
          Retomar preparação
        </Button>
      </div>
    )
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 p-3 text-sm font-medium text-primary"
    >
      <LoaderCircle className="animate-spin" aria-hidden="true" />
      Processando participantes automaticamente...
    </div>
  )
}
