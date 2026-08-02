"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { onboardingSteps } from "@/data/onboarding-steps"
import { cn } from "@/lib/utils"

const SWIPE_THRESHOLD_PX = 50
const STEP_TRANSITION_DURATION_MS = 220
const ENTRY_PAINT_DELAY_MS = 30

type TouchPosition = {
  x: number
  y: number
}

type TransitionPhase = "idle" | "exiting" | "entering"

export function OnboardingCarousel({
  initialStep,
}: Readonly<{ initialStep: number }>) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(1)
  const [transitionPhase, setTransitionPhase] =
    useState<TransitionPhase>("idle")
  const touchStart = useRef<TouchPosition | null>(null)
  const transitionTimeout = useRef<number | null>(null)
  const entryTimeout = useRef<number | null>(null)
  const step = onboardingSteps[currentStep]
  const isLastStep = currentStep === onboardingSteps.length - 1

  useEffect(() => {
    const nextStep = onboardingSteps[currentStep + 1]

    if (nextStep) {
      const nextImage = new window.Image()
      nextImage.src = nextStep.image
    }
  }, [currentStep])

  useEffect(() => {
    return () => {
      if (transitionTimeout.current !== null) {
        window.clearTimeout(transitionTimeout.current)
      }

      if (entryTimeout.current !== null) {
        window.clearTimeout(entryTimeout.current)
      }
    }
  }, [])

  function goToStep(stepIndex: number, direction: 1 | -1) {
    if (transitionPhase !== "idle") {
      return
    }

    setTransitionDirection(direction)
    setTransitionPhase("exiting")

    transitionTimeout.current = window.setTimeout(() => {
      setCurrentStep(stepIndex)
      router.replace(`/onboarding?step=${stepIndex + 1}`, { scroll: false })
      setTransitionPhase("entering")

      entryTimeout.current = window.setTimeout(() => {
        setTransitionPhase("idle")
      }, ENTRY_PAINT_DELAY_MS)
    }, STEP_TRANSITION_DURATION_MS)
  }

  function handleNext() {
    if (transitionPhase !== "idle") {
      return
    }

    if (isLastStep) {
      router.push("/onboarding/profile")
      return
    }

    goToStep(currentStep + 1, 1)
  }

  function handlePrevious() {
    if (currentStep > 0) {
      goToStep(currentStep - 1, -1)
    }
  }

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.changedTouches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current
    touchStart.current = null

    if (!start) {
      return
    }

    const touch = event.changedTouches[0]
    const horizontalDistance = touch.clientX - start.x
    const verticalDistance = touch.clientY - start.y

    if (
      Math.abs(horizontalDistance) < SWIPE_THRESHOLD_PX ||
      Math.abs(horizontalDistance) <= Math.abs(verticalDistance)
    ) {
      return
    }

    if (horizontalDistance < 0) {
      handleNext()
    } else {
      handlePrevious()
    }
  }

  return (
    <div
      className="grid h-full touch-pan-y grid-rows-[minmax(0,1fr)_auto] px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={cn(
          "duration-220ms flex min-h-0 flex-col items-center justify-center text-center transition-[opacity,transform] ease-out",
          transitionPhase === "idle" && "translate-x-0 opacity-100",
          transitionPhase === "exiting" &&
            (transitionDirection === 1
              ? "-translate-x-6 opacity-0"
              : "translate-x-6 opacity-0"),
          transitionPhase === "entering" &&
            (transitionDirection === 1
              ? "translate-x-6 opacity-0"
              : "-translate-x-6 opacity-0")
        )}
      >
        <div className="relative aspect-square w-full max-w-80">
          <Image
            src={step.image}
            alt=""
            fill
            priority={currentStep === 0}
            sizes="(max-width: 430px) 80vw, 320px"
            className="object-contain"
          />
        </div>

        <div className="mt-6 max-w-sm space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">{step.title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {step.description}
          </p>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <p className="sr-only" aria-live="polite">
          Etapa {currentStep + 1} de {onboardingSteps.length}
        </p>
        <div className="flex justify-center gap-2" aria-hidden="true">
          {onboardingSteps.map((onboardingStep, index) => (
            <span
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
              )}
              key={onboardingStep.title}
            />
          ))}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleNext}
          disabled={transitionPhase !== "idle"}
        >
          {isLastStep ? "Configurar meu perfil" : "Próximo"}
        </Button>
      </div>
    </div>
  )
}
