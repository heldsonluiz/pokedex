"use client"

import { Building2, Check, LockKeyhole, Sparkles } from "lucide-react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"
import { useEffect } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const CELEBRATION_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 18,
} as const

export function AnimatedXpReward({
  amount,
  celebrate = true,
}: Readonly<{ amount: number; celebrate?: boolean }>) {
  const reduceMotion = useReducedMotion()
  const value = useMotionValue(reduceMotion || !celebrate ? amount : 0)
  const rounded = useTransform(value, (latest) => Math.round(latest))

  useEffect(() => {
    if (reduceMotion || !celebrate) {
      value.set(amount)
      return
    }

    const controls = animate(value, amount, {
      duration: 0.75,
      delay: 0.35,
      ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [amount, celebrate, reduceMotion, value])

  return (
    <motion.div
      initial={reduceMotion || !celebrate ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : 0.28, duration: 0.3 }}
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gamification/12 px-4 py-2 font-semibold text-gamification ring-1 ring-gamification/25"
      aria-label={`${amount} pontos de experiência recebidos`}
    >
      <Sparkles className="size-4" aria-hidden="true" />
      <span aria-hidden="true">
        +<motion.span>{rounded}</motion.span> XP
      </span>
    </motion.div>
  )
}

export function TagRevealCard({
  imageUrl,
  name,
  celebrate = true,
}: Readonly<{ imageUrl: string; name: string; celebrate?: boolean }>) {
  const reduceMotion = useReducedMotion()
  const shouldAnimate = celebrate && !reduceMotion

  return (
    <div className="relative size-28 perspective-[700px]">
      <motion.div
        initial={shouldAnimate ? { rotateY: 180, scale: 0.82 } : false}
        animate={{ rotateY: 0, scale: 1 }}
        transition={
          shouldAnimate
            ? {
                rotateY: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
                ...CELEBRATION_SPRING,
              }
            : { duration: 0 }
        }
        className="relative size-full transform-3d"
      >
        <span className="absolute inset-0 flex transform-[rotateY(180deg)] items-center justify-center rounded-3xl bg-(image:--gradient-immersive) text-white shadow-glow-primary backface-hidden">
          <LockKeyhole className="size-8" aria-hidden="true" />
        </span>

        <span className="absolute inset-0 overflow-hidden rounded-3xl bg-white p-2 shadow-card ring-1 ring-foreground/10 backface-hidden">
          <Avatar className="size-full rounded-2xl">
            <AvatarImage
              src={imageUrl}
              alt={`Tag ${name}`}
              className="rounded-2xl object-contain"
            />
            <AvatarFallback className="rounded-2xl">TAG</AvatarFallback>
          </Avatar>
          {shouldAnimate && (
            <motion.span
              initial={{ x: "-180%" }}
              animate={{ x: "220%" }}
              transition={{ delay: 0.52, duration: 0.58, ease: "easeInOut" }}
              className="absolute inset-y-0 w-8 rotate-12 bg-white/70 blur-sm"
              aria-hidden="true"
            />
          )}
        </span>
      </motion.div>
    </div>
  )
}

export function CompanyVisitStamp({
  name,
  celebrate = true,
}: Readonly<{ name: string; celebrate?: boolean }>) {
  const reduceMotion = useReducedMotion()
  const shouldAnimate = celebrate && !reduceMotion

  return (
    <div className="relative flex size-28 items-center justify-center overflow-visible">
      {shouldAnimate &&
        [0, 1, 2, 3].map((particle) => (
          <motion.span
            key={particle}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 0.75, 0],
              scale: [0, 1, 0.7],
              x: particle % 2 === 0 ? -54 : 54,
              y: particle < 2 ? -38 : 38,
            }}
            transition={{ delay: 0.42, duration: 0.55 }}
            className="absolute size-2 rotate-45 bg-success/55"
            aria-hidden="true"
          />
        ))}

      <motion.div
        initial={
          shouldAnimate
            ? { y: -54, rotate: -12, scale: 1.35, opacity: 0 }
            : false
        }
        animate={{ y: 0, rotate: -6, scale: 1, opacity: 1 }}
        transition={shouldAnimate ? CELEBRATION_SPRING : { duration: 0 }}
        className="flex size-24 flex-col items-center justify-center rounded-full border-[3px] border-success text-success shadow-[inset_0_0_0_3px_color-mix(in_oklab,var(--success)_18%,transparent),0_8px_20px_rgb(21_128_61/18%)]"
        aria-label={`Visita à ${name} registrada`}
      >
        <Building2 className="size-7" aria-hidden="true" />
        <span className="mt-1 text-[10px] font-black tracking-[0.16em] uppercase">
          Visitado
        </span>
      </motion.div>
    </div>
  )
}

export function MissionCompletionBadge({
  imageUrl,
  title,
  celebrate = true,
}: Readonly<{ imageUrl?: string; title: string; celebrate?: boolean }>) {
  const reduceMotion = useReducedMotion()
  const shouldAnimate = celebrate && !reduceMotion

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.72, rotate: -5 } : false}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={shouldAnimate ? CELEBRATION_SPRING : { duration: 0 }}
      className={cn(
        "relative flex size-28 items-center justify-center overflow-hidden rounded-3xl",
        imageUrl ? "bg-card" : "bg-success/15"
      )}
      aria-label={`Missão ${title} concluída`}
    >
      {imageUrl && (
        <Avatar className="absolute inset-0 size-full rounded-3xl">
          <AvatarImage
            src={imageUrl}
            alt=""
            className="rounded-3xl object-cover"
          />
          <AvatarFallback className="rounded-3xl">MISSÃO</AvatarFallback>
        </Avatar>
      )}
      {imageUrl && <span className="absolute inset-0 bg-black/35" />}

      <motion.span
        initial={shouldAnimate ? { scale: 0, rotate: -24 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={
          shouldAnimate
            ? { ...CELEBRATION_SPRING, delay: 0.24 }
            : { duration: 0 }
        }
        className="relative flex size-14 items-center justify-center rounded-full bg-success text-white shadow-lg ring-4 ring-white/75"
      >
        <Check className="size-8 stroke-3" aria-hidden="true" />
      </motion.span>
    </motion.div>
  )
}
