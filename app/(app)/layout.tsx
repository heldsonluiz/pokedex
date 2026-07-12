import type { ReactNode } from "react"

import { requireAuth } from "@/lib/require-auth"

type AuthenticatedLayoutProps = Readonly<{
  children: ReactNode
}>

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  await requireAuth()

  return children
}
