import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell"
import { requireAuth } from "@/lib/require-auth"
import { requireProfileForSession } from "@/modules/profile/profile.service"

type AuthenticatedLayoutProps = Readonly<{
  children: ReactNode
}>

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await requireAuth()
  const profile = await requireProfileForSession(session)

  if (!profile.onboardingCompleted) {
    redirect("/onboarding")
  }

  return (
    <AuthenticatedAppShell accessRoles={profile.accessRoles}>
      {children}
    </AuthenticatedAppShell>
  )
}
