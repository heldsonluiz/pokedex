"use client"

import { doc, onSnapshot } from "firebase/firestore"
import {
  CircleAlert,
  Dices,
  LoaderCircle,
  RotateCw,
  WifiOff,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"

import { clientFirestore } from "@/lib/firebase/client"

import { RAFFLE_LIVE_CHANNEL } from "./raffle-live-channel"

type LiveConnectionStatus =
  "connecting" | "connected" | "offline" | "unavailable"

export function RaffleLiveRefresh({
  children,
  eventId,
  signalCollection,
  stageKey,
}: Readonly<{
  children: ReactNode
  eventId: string
  signalCollection: string
  stageKey: string
}>) {
  const router = useRouter()
  const [drawingPrizeName, setDrawingPrizeName] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] =
    useState<LiveConnectionStatus>("connecting")
  const [listenerVersion, setListenerVersion] = useState(0)
  const [isRefreshing, startRefreshTransition] = useTransition()
  const refreshRequested = useRef(false)
  const receivedInitialSignal = useRef(false)

  const requestRefresh = useCallback(() => {
    if (refreshRequested.current) {
      return
    }

    refreshRequested.current = true
    startRefreshTransition(() => router.refresh())
  }, [router])

  useEffect(() => {
    if (refreshRequested.current && !isRefreshing) {
      refreshRequested.current = false
      setDrawingPrizeName(null)
    }
  }, [isRefreshing])

  useEffect(() => {
    const signalReference = doc(clientFirestore, signalCollection, eventId)

    return onSnapshot(
      signalReference,
      { includeMetadataChanges: true },
      (snapshot) => {
        setConnectionStatus(
          snapshot.metadata.fromCache ? "connecting" : "connected"
        )

        const signal = snapshot.data()
        const phase = signal?.phase
        const prizeName = signal?.prizeName

        if (!receivedInitialSignal.current) {
          receivedInitialSignal.current = true

          if (phase === "drawing") {
            setDrawingPrizeName(
              typeof prizeName === "string" ? prizeName : "o prêmio"
            )
          }

          return
        }

        if (phase === "drawing") {
          setDrawingPrizeName(
            typeof prizeName === "string" ? prizeName : "o prêmio"
          )
          return
        }

        if (phase === "updated") {
          requestRefresh()
        }
      },
      (error) => {
        console.warn("Raffle live synchronization is unavailable", error.code)
        setConnectionStatus("unavailable")
      }
    )
  }, [eventId, listenerVersion, requestRefresh, signalCollection])

  useEffect(() => {
    function handleOffline() {
      setConnectionStatus("offline")
    }

    function handleOnline() {
      receivedInitialSignal.current = false
      setConnectionStatus("connecting")
      setListenerVersion((currentVersion) => currentVersion + 1)
      requestRefresh()
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    if (!window.navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [requestRefresh])

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return
    }

    const channel = new BroadcastChannel(RAFFLE_LIVE_CHANNEL)

    channel.addEventListener("message", (event) => {
      if (event.data?.type === "raffle-drawing") {
        setDrawingPrizeName(
          typeof event.data.prizeName === "string"
            ? event.data.prizeName
            : "o prêmio"
        )
      }

      if (event.data?.type === "raffle-drawing-cancelled") {
        setDrawingPrizeName(null)
      }

      if (event.data?.type === "raffle-updated") {
        requestRefresh()
      }
    })

    return () => channel.close()
  }, [requestRefresh])

  function retryConnection() {
    receivedInitialSignal.current = false
    setConnectionStatus("connecting")
    setListenerVersion((currentVersion) => currentVersion + 1)
    requestRefresh()
  }

  const content = drawingPrizeName ? (
    <div className="flex w-full max-w-5xl flex-col items-center justify-center text-center">
      <div className="relative flex size-28 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <span className="relative flex size-22 items-center justify-center rounded-full border border-primary/40 bg-primary/20 shadow-glow-primary">
          <LoaderCircle
            className="size-12 animate-spin text-secondary"
            aria-hidden
          />
        </span>
      </div>
      <div className="mt-6 flex items-center gap-2.5 text-secondary">
        <Dices className="size-6 animate-pulse" aria-hidden />
        <p className="font-pixel-square text-xl tracking-widest uppercase">
          Sorteando {drawingPrizeName}
        </p>
      </div>
      <p className="mt-4 text-lg text-muted-foreground">
        Cada ticket representa uma chance
      </p>
    </div>
  ) : (
    children
  )
  const contentKey = drawingPrizeName ? `drawing:${drawingPrizeName}` : stageKey

  return (
    <>
      <RaffleStageTransition transitionKey={contentKey}>
        {content}
      </RaffleStageTransition>
      <LiveConnectionIndicator
        status={connectionStatus}
        onRetry={retryConnection}
      />
    </>
  )
}

function RaffleStageTransition({
  children,
  transitionKey,
}: Readonly<{ children: ReactNode; transitionKey: string }>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const displayedKeyRef = useRef(transitionKey)
  const requestedContentRef = useRef(children)
  const [displayedContent, setDisplayedContent] = useState(children)

  useEffect(() => {
    requestedContentRef.current = children
  }, [children])

  useEffect(() => {
    if (displayedKeyRef.current === transitionKey) return

    const container = containerRef.current
    let cancelled = false
    let exitAnimation: Animation | undefined
    let enterAnimation: Animation | undefined
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    async function transition() {
      if (container?.animate && !reduceMotion) {
        exitAnimation = container.animate(
          [
            { opacity: 1, transform: "translateY(0) scale(1)" },
            { opacity: 0, transform: "translateY(-8px) scale(0.985)" },
          ],
          { duration: 180, easing: "ease-in", fill: "forwards" }
        )
        await exitAnimation.finished.catch(() => undefined)
        exitAnimation.cancel()
      }

      if (cancelled) return
      displayedKeyRef.current = transitionKey
      setDisplayedContent(requestedContentRef.current)

      if (container?.animate && !reduceMotion) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve())
        )

        if (cancelled) return
        enterAnimation = container.animate(
          [
            { opacity: 0, transform: "translateY(8px) scale(0.985)" },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ],
          { duration: 320, easing: "ease-out", fill: "both" }
        )
        await enterAnimation.finished.catch(() => undefined)
        enterAnimation.cancel()
      }
    }

    void transition()

    return () => {
      cancelled = true
      exitAnimation?.cancel()
      enterAnimation?.cancel()
    }
  }, [transitionKey])

  return (
    <div ref={containerRef} className="flex w-full justify-center">
      {displayedContent}
    </div>
  )
}

function LiveConnectionIndicator({
  status,
  onRetry,
}: Readonly<{
  status: LiveConnectionStatus
  onRetry: () => void
}>) {
  if (status === "connected") {
    return null
  }

  const content = {
    connecting: {
      icon: <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />,
      label: "Conectando ao tempo real",
    },
    offline: {
      icon: <WifiOff className="size-4" aria-hidden="true" />,
      label: "Sem conexão · exibindo o último resultado",
    },
    unavailable: {
      icon: <CircleAlert className="size-4" aria-hidden="true" />,
      label: "Atualização automática indisponível",
    },
  } as const
  const current = content[status]

  return (
    <div
      className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-xl border border-white/15 bg-black/80 px-3 py-2 text-sm text-white shadow-2xl"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-2 text-white/80">
        {current.icon}
        {current.label}
      </span>
      {status !== "connecting" && (
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 font-semibold transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          onClick={onRetry}
        >
          <RotateCw className="size-3.5" aria-hidden="true" />
          Atualizar
        </button>
      )}
    </div>
  )
}
