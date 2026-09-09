"use client"

import type confetti from "canvas-confetti"
import { useReducedMotion } from "motion/react"
import { useEffect, useRef } from "react"

export function AchievementConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<ReturnType<typeof confetti.create> | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion || !canvasRef.current) return
    let cancelled = false
    const canvas = canvasRef.current

    void import("canvas-confetti")
      .then(({ default: confetti }) => {
        if (cancelled) return
        instanceRef.current ??= confetti.create(canvas, {
          resize: true,
          disableForReducedMotion: true,
        })
        void instanceRef.current({
          particleCount: 65,
          spread: 100,
          startVelocity: 23,
          gravity: 0.85,
          ticks: 150,
          scalar: 0.85,
          shapes: ["square"],
          colors: ["#7c3aed", "#8bff3d", "#f6f118", "#06b6d4"],
          origin: { x: 0.5, y: 0.55 },
        })
      })
      .catch(() => {
        // A decorative effect must never prevent the result from being shown.
      })

    return () => {
      cancelled = true
      instanceRef.current?.reset()
    }
  }, [reduceMotion])

  if (reduceMotion) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 size-full"
    />
  )
}
