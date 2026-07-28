"use client"

import { usePathname, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

import { AppHeader } from "./app-header"
import { AppShell } from "./app-shell"
import { BottomNavigation } from "./bottom-navigation"

type RouteLayout = {
  title: string
  showHeader?: boolean
  showNavigation: boolean
  backHref?: string
  theme?: "light" | "dark"
}

const routeLayouts: Record<string, RouteLayout> = {
  "/home": {
    title: "Início",
    showNavigation: true,
  },
  "/missions": {
    title: "Missões",
    showNavigation: true,
  },
  "/scan": {
    title: "Scanner",
    showNavigation: true,
    theme: "dark",
  },
  "/passport": {
    title: "Passaporte",
    showNavigation: true,
  },
  "/profile": {
    title: "Perfil",
    showNavigation: true,
  },
  "/profile/edit": {
    title: "Editar perfil",
    showHeader: true,
    showNavigation: false,
    backHref: "/profile",
    theme: "dark",
  },
  "/profile/qr-code": {
    title: "Meu QR Code",
    showHeader: true,
    showNavigation: false,
    backHref: "/profile",
    theme: "dark",
  },
}

const fallbackLayout: RouteLayout = {
  title: "DevFest",
  showHeader: true,
  showNavigation: false,
  backHref: "/home",
}

export function AuthenticatedAppShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeLayout = routeLayouts[pathname] ?? fallbackLayout
  const backHref =
    pathname === "/profile/qr-code" && searchParams.get("source") === "home"
      ? "/home"
      : routeLayout.backHref

  return (
    <AppShell
      header={
        routeLayout.showHeader ? (
          <AppHeader
            title={routeLayout.title}
            showBack={Boolean(backHref)}
            backHref={backHref}
          />
        ) : undefined
      }
      navigation={routeLayout.showNavigation ? <BottomNavigation /> : undefined}
      theme={routeLayout.theme}
    >
      {children}
    </AppShell>
  )
}
