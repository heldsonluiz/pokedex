"use client"

import { AlertCircle } from "lucide-react"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { Button } from "@/components/ui/button"
import { signOutCurrentUser } from "@/modules/auth/auth.actions"

type OnboardingErrorProps = Readonly<{
  reset: () => void
}>

export default function OnboardingError({ reset }: OnboardingErrorProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
      <span className="rounded-full bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="size-8" aria-hidden="true" />
      </span>

      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">
          Não foi possível carregar o onboarding
        </h1>
        <p className="text-sm text-muted-foreground">
          Verifique sua conexão e tente novamente. Seu progresso não foi
          perdido.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="button" onClick={reset}>
          Tentar novamente
        </Button>

        <form action={signOutCurrentUser}>
          <SignOutButton />
        </form>
      </div>
    </div>
  )
}
