"use client"

import { RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

import type { UserQrCode } from "./user-qr-code.service"

function isUserQrCodeResponse(value: unknown): value is UserQrCode {
  if (!value || typeof value !== "object") {
    return false
  }

  return (
    "value" in value &&
    typeof value.value === "string" &&
    "svg" in value &&
    typeof value.svg === "string" &&
    "expiresAt" in value &&
    typeof value.expiresAt === "string"
  )
}

export function UserQrCodeCard({
  initialQrCode,
}: Readonly<{ initialQrCode: UserQrCode }>) {
  const [qrCode, setQrCode] = useState<UserQrCode>(initialQrCode)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(60)

  const loadQrCode = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/profile/qr-code", {
        cache: "no-store",
        signal,
      })
      const body: unknown = await response.json()

      if (!response.ok || !isUserQrCodeResponse(body)) {
        throw new Error("Invalid QR Code response")
      }

      setQrCode(body)
      setRemainingSeconds(
        Math.max(
          0,
          Math.ceil((new Date(body.expiresAt).getTime() - Date.now()) / 1_000)
        )
      )
    } catch (loadError) {
      if (
        loadError instanceof DOMException &&
        loadError.name === "AbortError"
      ) {
        return
      }

      setError("Não foi possível gerar seu QR Code. Tente novamente.")
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const expiresAt = new Date(qrCode.expiresAt).getTime()
    const updateCountdown = () => {
      setRemainingSeconds(
        Math.max(0, Math.ceil((expiresAt - Date.now()) / 1_000))
      )
    }
    const countdownInterval = window.setInterval(updateCountdown, 1_000)
    const refreshDelay = Math.max(0, expiresAt - Date.now() - 10_000)
    const refreshTimeout = window.setTimeout(() => {
      void loadQrCode()
    }, refreshDelay)

    return () => {
      window.clearInterval(countdownInterval)
      window.clearTimeout(refreshTimeout)
    }
  }, [loadQrCode, qrCode])

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
        <Button type="button" onClick={() => void loadQrCode()}>
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-center">
      <div
        className="mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-2xl bg-white p-3 shadow-card [&_svg]:h-full [&_svg]:w-full"
        aria-label="QR Code temporário do participante"
        dangerouslySetInnerHTML={{ __html: qrCode.svg }}
      />

      <div aria-live="polite">
        <p className="text-sm font-medium">
          Código válido por {remainingSeconds} segundos
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          O código é renovado automaticamente antes de expirar.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={() => void loadQrCode()}
      >
        <RefreshCw
          data-icon="inline-start"
          className={isLoading ? "animate-spin" : undefined}
          aria-hidden="true"
        />
        Renovar agora
      </Button>
    </div>
  )
}
