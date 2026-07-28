import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { requireAuth } from "@/lib/require-auth"
import { requireProfileForSession } from "@/modules/profile/profile.service"

type ProtectedOnboardingLayoutProps = Readonly<{
  children: ReactNode
}>

export default async function ProtectedOnboardingLayout({
  children,
}: ProtectedOnboardingLayoutProps) {
  const session = await requireAuth()
  const profile = await requireProfileForSession(session)

  if (profile.onboardingCompleted) {
    redirect("/home")
  }

  return children
}
