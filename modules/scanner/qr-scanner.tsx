"use client"

import type { IScannerControls } from "@zxing/browser"
import {
  AlertCircle,
  Camera,
  CameraOff,
  LoaderCircle,
  ScanLine,
  WifiOff,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  buildQrCodeUrl,
  parseQrCodeUrl,
} from "@/modules/qr-code/qr-code.contract"

import {
  classifyCameraError,
  getScannerFeedback,
  mapQrCodeError,
  type ScannerFailure,
} from "./scanner-feedback"

type ScannerStatus =
  "idle" | "requesting-permission" | "scanning" | "processing" | "failure"

type QrScannerProps = Readonly<{
  appUrl: string
  eventId: string
}>

export function QrScanner({ appUrl, eventId }: QrScannerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const scanSessionRef = useRef(0)
  const isProcessingRef = useRef(false)
  const [status, setStatus] = useState<ScannerStatus>("requesting-permission")
  const [failure, setFailure] = useState<ScannerFailure | null>(null)

  const releaseCamera = useCallback(() => {
    scanSessionRef.current += 1
    controlsRef.current?.stop()
    controlsRef.current = null

    const stream = videoRef.current?.srcObject

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const showFailure = useCallback(
    (nextFailure: ScannerFailure) => {
      releaseCamera()
      isProcessingRef.current = false
      setFailure(nextFailure)
      setStatus("failure")
    },
    [releaseCamera]
  )

  const handleDecodedValue = useCallback(
    (value: string, controls: IScannerControls) => {
      if (isProcessingRef.current) {
        return
      }

      isProcessingRef.current = true
      controls.stop()
      controlsRef.current = null
      scanSessionRef.current += 1
      setStatus("processing")

      const parsedQrCode = parseQrCodeUrl(value, {
        appUrl,
        eventId,
      })

      if (!parsedQrCode.valid) {
        showFailure(mapQrCodeError(parsedQrCode))
        return
      }

      if (parsedQrCode.target.type !== "user") {
        showFailure("target-unavailable")
        return
      }

      if (!navigator.onLine) {
        showFailure("offline")
        return
      }

      const normalizedUrl = new URL(buildQrCodeUrl(parsedQrCode.target, appUrl))
      router.push(`${normalizedUrl.pathname}${normalizedUrl.search}`)
    },
    [appUrl, eventId, router, showFailure]
  )

  const startScanner = useCallback(async () => {
    releaseCamera()
    setFailure(null)
    isProcessingRef.current = false

    if (!window.isSecureContext) {
      showFailure("insecure-context")
      return
    }

    if (!navigator.onLine) {
      showFailure("offline")
      return
    }

    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      showFailure("camera-unavailable")
      return
    }

    const scanSession = scanSessionRef.current
    setStatus("requesting-permission")

    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser")
      const codeReader = new BrowserQRCodeReader()
      const controls = await codeReader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: {
              ideal: "environment",
            },
            height: {
              ideal: 720,
            },
            width: {
              ideal: 1280,
            },
          },
        },
        videoRef.current,
        (result, _error, scannerControls) => {
          if (result) {
            handleDecodedValue(result.getText(), scannerControls)
          }
        }
      )

      if (scanSession !== scanSessionRef.current) {
        controls.stop()
        return
      }

      controlsRef.current = controls
      setStatus("scanning")
    } catch (error) {
      if (scanSession !== scanSessionRef.current) {
        return
      }

      showFailure(classifyCameraError(error))
    }
  }, [handleDecodedValue, releaseCamera, showFailure])

  useEffect(() => {
    const startTimeout = window.setTimeout(() => {
      void startScanner()
    }, 0)

    function handleVisibilityChange() {
      if (document.hidden) {
        releaseCamera()
        isProcessingRef.current = false
        setFailure(null)
        setStatus("idle")
        return
      }

      void startScanner()
    }

    function handleOffline() {
      if (controlsRef.current) {
        showFailure("offline")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.clearTimeout(startTimeout)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("offline", handleOffline)
      releaseCamera()
    }
  }, [releaseCamera, showFailure, startScanner])

  const feedback = failure ? getScannerFeedback(failure) : null
  const FailureIcon = failure === "offline" ? WifiOff : CameraOff

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="size-full object-cover"
          aria-label="Visualização da câmera"
          autoPlay
          muted
          playsInline
        />

        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-10">
            <div className="aspect-square w-full max-w-72 rounded-3xl border-2 border-secondary shadow-[0_0_0_999px_rgb(2_6_23/55%)]">
              <span className="sr-only">Área de leitura do QR Code</span>
            </div>
          </div>
        )}

        {status !== "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-background/95 px-6 text-center">
            {status === "idle" && (
              <>
                <span className="rounded-full bg-secondary/15 p-4 text-secondary">
                  <Camera className="size-8" aria-hidden="true" />
                </span>
                <div className="max-w-sm space-y-2">
                  <h1 className="text-xl font-semibold">
                    Leia um QR Code do evento
                  </h1>
                  <p className="text-sm leading-6 text-muted-foreground">
                    A câmera será usada somente enquanto esta tela estiver
                    aberta.
                  </p>
                </div>
                <Button type="button" size="lg" onClick={startScanner}>
                  <Camera data-icon="inline-start" aria-hidden="true" />
                  Ativar câmera
                </Button>
              </>
            )}

            {(status === "requesting-permission" ||
              status === "processing") && (
              <>
                <LoaderCircle
                  className="size-9 animate-spin text-secondary"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <h1 className="text-xl font-semibold">
                    {status === "processing"
                      ? "Validando QR Code"
                      : "Preparando a câmera"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {status === "processing"
                      ? "Aguarde enquanto verificamos o código."
                      : "Autorize o acesso quando o navegador solicitar."}
                  </p>
                </div>
              </>
            )}

            {status === "failure" && feedback && (
              <>
                <span className="rounded-full bg-destructive/10 p-4 text-destructive">
                  {failure === "offline" ? (
                    <WifiOff className="size-8" aria-hidden="true" />
                  ) : failure === "invalid-qr" ||
                    failure === "invalid-origin" ||
                    failure === "invalid-event" ||
                    failure === "unsupported-type" ||
                    failure === "target-unavailable" ? (
                    <AlertCircle className="size-8" aria-hidden="true" />
                  ) : (
                    <FailureIcon className="size-8" aria-hidden="true" />
                  )}
                </span>
                <div className="max-w-sm space-y-2" role="alert">
                  <h1 className="text-xl font-semibold">{feedback.title}</h1>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {feedback.description}
                  </p>
                </div>
                <Button type="button" size="lg" onClick={startScanner}>
                  <ScanLine data-icon="inline-start" aria-hidden="true" />
                  Tentar novamente
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {status === "scanning" && (
        <div
          className="shrink-0 space-y-1 px-6 py-4 text-center"
          aria-live="polite"
        >
          <p className="font-medium">Aponte para o QR Code</p>
          <p className="text-xs text-muted-foreground">
            Mantenha o código dentro da área destacada.
          </p>
        </div>
      )}
    </div>
  )
}
