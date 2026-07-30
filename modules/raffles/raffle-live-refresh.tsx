"use client"

import { Dices, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"

import { RAFFLE_LIVE_CHANNEL } from "./raffle-live-channel"

export function RaffleLiveRefresh({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter()
  const [drawingPrizeName, setDrawingPrizeName] = useState<string | null>(null)
  const [isRefreshing, startRefreshTransition] = useTransition()
  const refreshRequested = useRef(false)

  useEffect(() => {
    if (refreshRequested.current && !isRefreshing) {
      refreshRequested.current = false
      setDrawingPrizeName(null)
    }
  }, [isRefreshing])

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
        refreshRequested.current = true
        startRefreshTransition(() => router.refresh())
      }
    })

    return () => channel.close()
  }, [router])

  if (drawingPrizeName) {
    return (
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
    )
  }

  return children
}
