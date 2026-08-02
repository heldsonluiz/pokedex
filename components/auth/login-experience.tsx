"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { signInWithGoogle } from "@/modules/auth/auth.actions"

import { SignInButton } from "./sign-in-button"

const MINIMUM_SESSION_CHECK_DURATION_MS = 2_000

type LoginExperienceProps = Readonly<{
  redirectTo: string
  errorMessage: string | null
}>

type SessionResponse = {
  user?: unknown
}

export function LoginExperience({
  redirectTo,
  errorMessage,
}: LoginExperienceProps) {
  const router = useRouter()
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function resolveSession() {
      const minimumDuration = new Promise((resolve) => {
        window.setTimeout(resolve, MINIMUM_SESSION_CHECK_DURATION_MS)
      })

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          signal: controller.signal,
        })
        const session: SessionResponse = response.ok
          ? ((await response.json()) as SessionResponse)
          : {}

        await minimumDuration

        if (controller.signal.aborted) {
          return
        }

        if (session.user) {
          router.replace("/home")
          return
        }

        setIsCheckingSession(false)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        await minimumDuration

        if (!controller.signal.aborted) {
          setIsCheckingSession(false)
        }
      }
    }

    void resolveSession()

    return () => controller.abort()
  }, [router])

  return (
    <div
      className="grid min-h-full grid-rows-[60px_minmax(14rem,0.9fr)_minmax(18rem,auto)] gap-4 px-8 pt-12 pb-[calc(2rem+env(safe-area-inset-bottom))]"
      aria-busy={isCheckingSession}
    >
      <header className="flex justify-center">
        <Image
          src="/images/brand/devfest-logo.png"
          alt="DevFest Triângulo"
          width={200}
          height={62}
          className="h-auto w-48"
        />
      </header>

      <div
        id="login-hero"
        aria-hidden="true"
        className={cn(
          "relative mx-auto w-full max-w-sm origin-center transform-gpu transition-transform duration-700 ease-in-out will-change-transform",
          isCheckingSession
            ? "translate-y-20 scale-[1.35]"
            : "translate-y-0 scale-100"
        )}
      >
        <Image
          src="/images/assets/login/crystals.png"
          alt=""
          fill
          priority
          sizes="(max-width: 420px) 90vw, 362px"
          className="object-contain px-1 opacity-10"
        />
        <Image
          src="/images/assets/login/login-hero.png"
          alt=""
          fill
          priority
          sizes="(max-width: 420px) 90vw, 362px"
          className="object-contain pr-10 pl-8"
        />
      </div>

      <section
        aria-labelledby={isCheckingSession ? undefined : "login-title"}
        className="flex min-h-72 flex-col items-center text-center"
      >
        {isCheckingSession ? (
          <p className="translate-y-40 text-sm leading-6 text-muted-foreground">
            Preparando sua jornada...
          </p>
        ) : (
          <div className="w-full animate-in duration-700 fade-in">
            <h1 id="login-title" className="text-xl font-bold tracking-tight">
              Sua jornada começa aqui!
            </h1>

            <p className="mt-3 max-w-sm text-xs leading-5 text-balance text-muted-foreground">
              Entre com sua conta Google para participar das missões, criar
              conexões e acompanhar seu progresso no DevFest.
            </p>

            {errorMessage && (
              <p
                role="alert"
                className="mt-4 w-full rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {errorMessage}
              </p>
            )}

            <form action={signInWithGoogle} className="mt-6 w-full">
              <input type="hidden" name="callbackUrl" value={redirectTo} />
              <SignInButton />
            </form>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Ao continuar, você concorda com o uso dos dados necessários para
              sua participação no evento.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
