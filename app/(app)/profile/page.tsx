import { ExternalLink, Pencil, QrCode } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
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

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
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
    </main>
  )
}
