"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"

type AuthErrorProps = Readonly<{
  error: Error & {
    digest?: string
  }
  reset: () => void
}>

export default function AuthError({ reset }: AuthErrorProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-8 text-center">
      <Image
        src="/images/assets/auth/auth-error.png"
        alt=""
        width={180}
        height={219}
        priority
        aria-hidden="true"
        className="h-auto w-40"
      />

      <section role="alert" aria-labelledby="auth-error-title" className="mt-6">
        <h1 id="auth-error-title" className="text-2xl font-bold">
          Não foi possível continuar
        </h1>

        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          Encontramos um problema inesperado. Verifique sua conexão e tente
          novamente.
        </p>

        <Button type="button" size="lg" className="mt-6" onClick={reset}>
          Tentar novamente
        </Button>
      </section>
    </div>
  )
}
