"use client"

import {
  Building2,
  CheckCircle2,
  Sparkles,
  Tags,
  Target,
  Trophy,
  X,
} from "lucide-react"
import { motion, useAnimationControls, useReducedMotion } from "motion/react"
import Link from "next/link"
import type { ReactNode } from "react"
import { useEffect, useLayoutEffect, useState } from "react"

import { AchievementConfetti } from "@/components/motion/achievement-confetti"
import { cn } from "@/lib/utils"

const RECENT_ACHIEVEMENT_WINDOW_MS = 30 * 60 * 1000

type CollectionEntryVariant = "card" | "row" | "stamp"

const entryInitialState: Record<
  CollectionEntryVariant,
  { opacity: number; rotate: number; rotateY: number; scale: number; y: number }
> = {
  card: { opacity: 0, rotate: 0, rotateY: 88, scale: 0.86, y: 0 },
  row: { opacity: 0, rotate: 0, rotateY: 0, scale: 0.97, y: 12 },
  stamp: { opacity: 0, rotate: -7, rotateY: 0, scale: 1.16, y: -14 },
}

const entryVisibleState = {
  opacity: 1,
  rotate: 0,
  rotateY: 0,
  scale: 1,
  y: 0,
}

export function CollectionEntryMotion({
  achievementKey,
  children,
  className,
  completedAt,
  enabled = true,
  variant = "row",
}: Readonly<{
  achievementKey: string
  children: ReactNode
  className?: string
  completedAt: number
  enabled?: boolean
  variant?: CollectionEntryVariant
}>) {
  const controls = useAnimationControls()
  const reduceMotion = useReducedMotion()

  useLayoutEffect(() => {
    if (!enabled || reduceMotion) return

    const isRecent = Date.now() - completedAt <= RECENT_ACHIEVEMENT_WINDOW_MS
    if (!isRecent) return

    controls.set(entryInitialState[variant])
    void controls.start(entryVisibleState, {
      type: "spring",
      stiffness: variant === "card" ? 180 : 230,
      damping: 19,
      delay: 0.08,
    })
  }, [achievementKey, completedAt, controls, enabled, reduceMotion, variant])

  return (
    <motion.div
      layout={!reduceMotion}
      animate={controls}
      className={cn(
        "relative min-w-0 perspective-[700px]",
        variant === "stamp" && "origin-center",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function SpringProgress({
  progress,
  className,
}: Readonly<{ progress: number; className?: string }>) {
  const reduceMotion = useReducedMotion()
  const normalizedProgress = Math.min(100, Math.max(0, progress)) / 100

  return (
    <motion.div
      initial={reduceMotion ? false : { scaleX: 0 }}
      animate={{ scaleX: normalizedProgress }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 95, damping: 20, mass: 0.8 }
      }
      className={cn("h-full w-full origin-left rounded-full", className)}
    />
  )
}

const categoryIcons = {
  companies: Building2,
  tags: Tags,
  missions: Target,
} as const

export function CollectionSummaryCard({
  achievementKey,
  category,
  completed,
  completedAt,
  label,
  total,
}: Readonly<{
  achievementKey?: string
  category: keyof typeof categoryIcons
  completed: number
  completedAt?: number
  label: string
  total: number
}>) {
  const controls = useAnimationControls()
  const glintControls = useAnimationControls()
  const reduceMotion = useReducedMotion()
  const complete = total > 0 && completed === total
  const Icon = categoryIcons[category]

  useEffect(() => {
    if (!complete || !achievementKey || !completedAt || reduceMotion) return

    const isRecent = Date.now() - completedAt <= RECENT_ACHIEVEMENT_WINDOW_MS
    if (!isRecent) return

    void controls.start({
      scale: [1, 1.09, 0.98, 1],
      rotate: [0, -2, 1, 0],
      transition: { duration: 0.9, times: [0, 0.35, 0.65, 1] },
    })
    void glintControls.start({
      opacity: [0, 1, 0],
      x: ["-160%", "240%"],
      transition: { duration: 0.7, ease: "easeInOut" },
    })
  }, [
    achievementKey,
    category,
    complete,
    completedAt,
    controls,
    glintControls,
    reduceMotion,
  ])

  return (
    <motion.div animate={controls} className="min-w-0">
      <Link
        href={`/passport?collection=${category}#passport-collections`}
        className={cn(
          "relative flex min-h-24 min-w-0 flex-col items-center gap-2 overflow-hidden rounded-2xl bg-card px-2 py-3 text-center ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          complete && "bg-success/5 ring-success/25"
        )}
        aria-label={`Ver coleção de ${label}: ${completed} de ${total}`}
      >
        <motion.span
          initial={{ opacity: 0, x: "-160%" }}
          animate={glintControls}
          className="pointer-events-none absolute inset-y-0 w-10 rotate-12 bg-white/65 blur-md"
          aria-hidden="true"
        />

        <span className="relative flex size-7 items-center justify-center">
          <Icon className="size-5 text-primary" aria-hidden="true" />
          {complete && (
            <motion.span
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 17 }}
              className="absolute -right-2 -bottom-1 flex size-4 items-center justify-center rounded-full bg-success text-white ring-2 ring-card"
            >
              <CheckCircle2 className="size-3" aria-hidden="true" />
            </motion.span>
          )}
        </span>
        <div className="relative">
          <p className="text-lg font-semibold tabular-nums">
            {completed}/{total}
          </p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </Link>
    </motion.div>
  )
}

export function CollectionCompletionCelebration({
  achievementKey,
  completedAt,
  enabled,
  label,
}: Readonly<{
  achievementKey?: string
  completedAt?: number
  enabled: boolean
  label: string
}>) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled || !achievementKey || !completedAt) return

    const age = Date.now() - completedAt
    if (age < 0 || age > RECENT_ACHIEVEMENT_WINDOW_MS) return

    const storageKey = `pokedex:collection-banner-count:v1:${achievementKey}:${completedAt}`
    let hideTimeout: ReturnType<typeof setTimeout> | undefined
    const showTimeout = window.setTimeout(() => {
      try {
        if (Number(window.localStorage.getItem(storageKey) ?? 0) >= 1) return
        window.localStorage.setItem(storageKey, "1")
      } catch {
        // Storage restrictions must not leave an invisible overlay on the page.
      }
      setVisible(true)
      hideTimeout = setTimeout(() => setVisible(false), 5_000)
    }, 0)

    return () => {
      window.clearTimeout(showTimeout)
      clearTimeout(hideTimeout)
    }
  }, [achievementKey, completedAt, enabled])

  if (!enabled || !achievementKey || !completedAt || !visible) return null

  function closeCelebration() {
    setVisible(false)
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: -28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      className="fixed top-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl bg-(image:--gradient-gamification) p-4 py-4 pr-12 text-gamification-foreground shadow-glow-gamification ring-1 ring-gamification/40"
      role="status"
      aria-live="polite"
    >
      <AchievementConfetti />
      <span className="absolute inset-x-0 top-0 h-1 bg-foreground/20" />
      <Sparkles className="absolute right-10 bottom-3 size-3 text-gamification-foreground/55" />

      <button
        type="button"
        onClick={closeCelebration}
        className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-background/20 text-gamification-foreground transition-colors hover:bg-background/35 focus-visible:ring-2 focus-visible:ring-gamification-foreground focus-visible:outline-none"
        aria-label="Fechar celebração"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <span className="relative flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-background/90 text-gamification shadow-card ring-1 ring-foreground/10">
          <Trophy className="size-6" />
        </span>
        <span className="min-w-0">
          <span className="block font-pixel-square text-xs text-gamification-foreground/75 uppercase">
            Coleção completa
          </span>
          <span className="mt-1 block truncate text-base font-semibold">
            Todas as {label.toLocaleLowerCase("pt-BR")} conquistadas
          </span>
        </span>
      </span>
    </motion.div>
  )
}
