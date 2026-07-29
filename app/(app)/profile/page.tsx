import {
  Award,
  ChevronRight,
  ExternalLink,
  Pencil,
  QrCode,
  UsersRound,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { signOutCurrentUser } from "@/modules/auth/auth.actions"
import { getBadgesForSession } from "@/modules/badges/badge.service"
import { requireProfileForSession } from "@/modules/profile/profile.service"
import { findSkillBySlug } from "@/modules/profile/profile-skills"

export const metadata: Metadata = {
  title: "Perfil",
}

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export default async function ProfilePage() {
  const session = await requireAuth()
  const profile = await requireProfileForSession(session)
  const badges = await getBadgesForSession(session)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <section className="flex items-start gap-4">
        <Avatar className="size-20">
          {profile.avatarUrl && (
            <AvatarImage
              src={profile.avatarUrl}
              alt={`Foto de ${profile.displayName}`}
            />
          )}

          <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">{profile.displayName}</h1>

          <p className="text-sm text-muted-foreground">
            {[profile.role, profile.company].filter(Boolean).join(" · ") ||
              "Complete suas informações"}
          </p>
        </div>

        <Link
          href="/profile/edit"
          className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
          aria-label="Editar perfil"
        >
          <Pencil aria-hidden="true" />
        </Link>
      </section>

      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle>Sobre</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {profile.bio}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Habilidades</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge
                  variant="secondary"
                  className="h-8 gap-1.5 border border-primary bg-transparent px-3 py-1 text-sm text-foreground"
                  key={skill}
                >
                  {findSkillBySlug(skill)?.name ?? skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Adicione habilidades para facilitar novas conexões.
            </p>
          )}
        </CardContent>
      </Card>

      {badges.available && badges.totalCount > 0 && (
        <Link
          href="/badges"
          className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Award className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Minhas badges</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {badges.earnedCount} de {badges.totalCount} conquistadas
            </p>
          </div>
          <ChevronRight
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </Link>
      )}

      {profile.link && (
        <a
          href={profile.link}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Abrir link do perfil
          <ExternalLink data-icon="inline-end" aria-hidden="true" />
        </a>
      )}

      <Link
        href="/profile/qr-code"
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        <QrCode data-icon="inline-start" aria-hidden="true" />
        Mostrar meu QR Code
      </Link>

      <Link
        href="/connections"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <UsersRound data-icon="inline-start" aria-hidden="true" />
        Minhas conexões
      </Link>

      <form action={signOutCurrentUser}>
        <SignOutButton className="w-full" />
      </form>
    </div>
  )
}
