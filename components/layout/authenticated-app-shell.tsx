"use client"

import { usePathname, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import type { AccessRole } from "@/modules/profile/profile.schema"

import { AppHeader } from "./app-header"
import { AppShell } from "./app-shell"
import { BottomNavigation } from "./bottom-navigation"

type RouteLayout = {
  title: string
  showHeader?: boolean
  showBack?: boolean
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
    showHeader: true,
    showBack: true,
    showNavigation: false,
  },
  "/scan": {
    title: "Scanner",
    showNavigation: true,
    theme: "dark",
  },
  "/passport": {
    title: "Passaporte",
    showHeader: true,
    showBack: true,
    showNavigation: false,
  },
  "/ranking": {
    title: "Ranking",
    showHeader: true,
    showNavigation: false,
    showBack: true,
  },
  "/tickets": {
    title: "Tickets",
    showHeader: true,
    showNavigation: false,
    showBack: true,
  },
  "/talks": {
    title: "Palestras",
    showHeader: true,
    showNavigation: false,
    showBack: true,
  },
  "/operations": {
    title: "Operações",
    showNavigation: true,
  },
  "/operations/talks": {
    title: "Avaliações de palestras",
    showHeader: true,
    showNavigation: false,
    backHref: "/operations",
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
    showBack: true,
  },
  "/companies": {
    title: "Empresas",
    showHeader: true,
    showNavigation: false,
    showBack: true,
  },
  "/tags": {
    title: "Tags",
    showHeader: true,
    showNavigation: false,
    showBack: true,
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
  accessRoles,
}: Readonly<{ children: ReactNode; accessRoles: AccessRole[] }>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeLayout =
    routeLayouts[pathname] ??
    (pathname === "/operations/scan"
      ? {
          title: "Atender participante",
          showHeader: true,
          showNavigation: false,
          backHref: "/operations",
          theme: "dark" as const,
        }
      : pathname.startsWith("/operations/participant/")
        ? {
            title: "Atendimento",
            showHeader: true,
            showNavigation: false,
            backHref: "/operations",
          }
        : pathname.startsWith("/missions/review/")
          ? {
              title: "Validar missão",
              showHeader: true,
              showNavigation: false,
              backHref: "/missions",
              theme: "dark" as const,
            }
          : pathname.startsWith("/connections/")
            ? {
                title: "Perfil da conexão",
                showHeader: true,
                showNavigation: false,
                backHref: "/connections",
              }
            : pathname.startsWith("/companies/")
              ? {
                  title: "Empresa",
                  showHeader: true,
                  showNavigation: false,
                  backHref: "/companies",
                }
              : pathname.startsWith("/talks/")
                ? {
                    title: "Palestra",
                    showHeader: true,
                    showNavigation: false,
                    backHref: "/talks",
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
              showBack={routeLayout.showBack ?? Boolean(backHref)}
              backHref={backHref}
            />
          ) : undefined
        }
        navigation={
          routeLayout.showNavigation ? (
            <BottomNavigation accessRoles={accessRoles} />
          ) : undefined
        }
        theme={routeLayout.theme}
      >
        {children}
      </AppShell>
    </>
  )
}
