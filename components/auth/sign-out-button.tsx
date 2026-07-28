"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

export function SignOutButton({ className }: Readonly<{ className?: string }>) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      aria-disabled={pending}
      aria-busy={pending}
      className={className}
    >
      {pending ? "Saindo..." : "Sair"}
    </Button>
  )
}
