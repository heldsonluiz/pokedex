import type { ReactNode } from "react"

import { AppShell } from "@/components/layout/app-shell"

type OnboardingLayoutProps = Readonly<{
  children: ReactNode
}>

export default async function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  return <AppShell theme="dark">{children}</AppShell>
}
