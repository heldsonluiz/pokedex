"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

export function SignInButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      aria-disabled={pending}
      aria-busy={pending}
      className="w-full"
    >
      {pending ? "Redirecionando..." : "Entrar com Google"}
    </Button>
  )
}
