import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AppShell } from "@/components/layout/app-shell"

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre com sua conta Google para participar do DevFest.",
  robots: {
    index: false,
    follow: false,
  },
}

type AuthLayoutProps = Readonly<{
  children: ReactNode
}>

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AppShell theme="dark">{children}</AppShell>
}
