import {
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Mail,
  UserRound,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { getConnectedProfileForSession } from "@/modules/networking/connection.service"
import { getLinkedinProfileUrl } from "@/modules/profile/profile.schema"
import { findSkillBySlug } from "@/modules/profile/profile-skills"

export const metadata: Metadata = {
  title: "Perfil da conexão",
}

export const dynamic = "force-dynamic"

type ConnectedProfilePageProps = Readonly<{
  params: Promise<{ connectionId: string }>
}>

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export default async function ConnectedProfilePage({
  params,
}: ConnectedProfilePageProps) {
  const [{ connectionId }, session] = await Promise.all([params, requireAuth()])
  const profile = await getConnectedProfileForSession(session, connectionId)

  if (!profile) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <section className="flex flex-col items-center rounded-3xl bg-(image:--gradient-immersive) p-6 text-center text-white shadow-card">
        <Avatar className="size-24 ring-2 ring-white/25">
          {profile.avatarUrl && (
            <AvatarImage
              src={profile.avatarUrl}
              alt={`Foto de ${profile.displayName}`}
            />
          )}
          <AvatarFallback className="bg-white/15 text-xl text-white">
            {getInitials(profile.displayName)}
          </AvatarFallback>
        </Avatar>

        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {profile.displayName}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          {[profile.role, profile.company].filter(Boolean).join(" · ") ||
            "Participante do evento"}
        </p>
      </section>

      {(profile.role || profile.company || profile.gender || profile.email) && (
        <section className="divide-y divide-foreground/10 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          {profile.role && (
            <ProfileDetail icon={BriefcaseBusiness} label="Atuação">
              {profile.role}
            </ProfileDetail>
          )}
          {profile.company && (
            <ProfileDetail icon={Building2} label="Empresa">
              {profile.company}
            </ProfileDetail>
          )}
          {profile.gender && (
            <ProfileDetail icon={UserRound} label="Gênero">
              {profile.gender}
            </ProfileDetail>
          )}
          <ProfileDetail icon={Mail} label="E-mail">
            {profile.email}
          </ProfileDetail>
        </section>
      )}

      {profile.bio && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Sobre</h2>
          <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
            {profile.bio}
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Habilidades</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="h-8 border border-primary bg-transparent px-3 text-sm text-foreground"
            >
              {findSkillBySlug(skill)?.name ?? skill}
            </Badge>
          ))}
        </div>
      </section>

      {(profile.linkedinUsername || profile.website) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.linkedinUsername && (
            <Link
              href={getLinkedinProfileUrl(profile.linkedinUsername)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              <ExternalLink aria-hidden="true" />
              Abrir LinkedIn
            </Link>
          )}
          {profile.website && (
            <Link
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "w-full"
              )}
            >
              <ExternalLink aria-hidden="true" />
              Abrir website
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function ProfileDetail({
  icon: Icon,
  label,
  children,
}: Readonly<{
  icon: typeof UserRound
  label: string
  children: string
}>) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium break-words">{children}</p>
      </div>
    </div>
  )
}
