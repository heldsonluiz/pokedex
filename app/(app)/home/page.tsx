import {
  BookOpen,
  Building2,
  ChevronRight,
  QrCode,
  ScanLine,
  Tags,
  Target,
  UserRound,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { requireProfileForSession } from "@/modules/profile/profile.service"

export const metadata: Metadata = {
  title: "Início",
}

const shortcuts = [
  {
    href: "/companies",
    label: "Empresas",
    description: "Explore os estandes",
    icon: Building2,
  },
  {
    href: "/tags",
    label: "Tags",
    description: "Encontre as escondidas",
    icon: Tags,
  },
  {
    href: "/missions",
    label: "Missões",
    description: "Veja os desafios",
    icon: Target,
  },
  {
    href: "/passport",
    label: "Passaporte",
    description: "Acompanhe sua jornada",
    icon: BookOpen,
  },
  {
    href: "/profile",
    label: "Meu perfil",
    description: "Revise seus dados",
    icon: UserRound,
  },
] as const

function getFirstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0]
}

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export default async function HomePage() {
  const session = await requireAuth()
  const profile = await requireProfileForSession(session)

  return (
    <div className="space-y-8 px-6 py-6">
      <section className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Boas-vindas ao DevFest
          </p>
          <h1 className="truncate text-2xl font-bold">
            Olá, {getFirstName(profile.displayName)}!
          </h1>
        </div>

        <Link
          href="/profile"
          className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Abrir meu perfil"
        >
          <Avatar className="size-12">
            {profile.avatarUrl && (
              <AvatarImage
                src={profile.avatarUrl}
                alt={`Foto de ${profile.displayName}`}
              />
            )}
            <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
          </Avatar>
        </Link>
      </section>

      <section className="space-y-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground/15">
          <ScanLine className="size-6" aria-hidden="true" />
        </span>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Continue sua jornada</h2>
          <p className="text-sm leading-6 text-primary-foreground/80">
            Leia os QR Codes espalhados pelo evento para participar das
            experiências.
          </p>
        </div>

        <Link
          href="/scan"
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "w-full"
          )}
        >
          <ScanLine data-icon="inline-start" aria-hidden="true" />
          Abrir scanner
        </Link>
      </section>

      <Link
        href="/profile/qr-code?source=home"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "w-full"
        )}
      >
        <QrCode data-icon="inline-start" aria-hidden="true" />
        Mostrar meu QR Code
      </Link>

      <section className="space-y-4" aria-labelledby="home-shortcuts-title">
        <h2 id="home-shortcuts-title" className="text-lg font-semibold">
          Atalhos
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map(({ href, label, description, icon: Icon }, index) => (
            <Link
              href={href}
              className={cn(
                "flex min-h-28 flex-col justify-between rounded-2xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                shortcuts.length % 2 === 1 &&
                  index === shortcuts.length - 1 &&
                  "col-span-2 min-h-24"
              )}
              key={href}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h3 className="font-semibold">{label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <p className="pb-2 text-center text-sm leading-6 text-muted-foreground">
        Explore o evento, participe das atividades e acompanhe sua jornada por
        aqui.
      </p>
    </div>
  )
}
