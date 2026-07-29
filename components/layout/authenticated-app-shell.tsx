"use client"

import { usePathname, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"

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
  "/ranking": {
    title: "Ranking",
    showHeader: true,
    showNavigation: false,
    backHref: "/home",
  },
  "/badges": {
    title: "Badges",
    showHeader: true,
    showNavigation: false,
    backHref: "/home",
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
  "/connections": {
    title: "Conexões",
    showHeader: true,
    showNavigation: false,
    backHref: "/profile",
  },
  "/companies": {
    title: "Empresas",
    showHeader: true,
    showNavigation: false,
    backHref: "/home",
  },
  "/tags": {
    title: "Tags",
    showHeader: true,
    showNavigation: false,
    backHref: "/home",
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
  const routeLayout =
    routeLayouts[pathname] ??
    (pathname.startsWith("/missions/review/")
      ? {
          title: "Validar missão",
          showHeader: true,
          showNavigation: false,
          backHref: "/missions",
          theme: "dark" as const,
        }
      : pathname.startsWith("/companies/")
        ? {
            title: "Empresa",
            showHeader: true,
            showNavigation: false,
            backHref: "/companies",
          }
        : fallbackLayout)
  const qrCodeSource =
    pathname === "/profile/qr-code" ? searchParams.get("source") : null
  const backHref =
    qrCodeSource === "home"
      ? "/home"
      : qrCodeSource === "missions"
        ? "/missions"
        : routeLayout.backHref

  return (
    <>
      <Toaster position="top-center" />
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
        navigation={
          routeLayout.showNavigation ? <BottomNavigation /> : undefined
        }
        theme={routeLayout.theme}
      >
        {children}
      </AppShell>
    </>
  )
}
