import type { Metadata } from "next"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { requireAuth } from "@/lib/require-auth"
import { requireProfileForSession } from "@/modules/profile/profile.service"

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
    <main className="mx-auto w-full max-w-3xl p-6">
      <section className="flex items-center gap-4">
        <Avatar className="size-20">
          {profile.avatarUrl && (
            <AvatarImage
              src={profile.avatarUrl}
              alt={`Foto de ${profile.displayName}`}
            />
          )}

          <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-2xl font-semibold">{profile.displayName}</h1>

          <p className="text-sm text-muted-foreground">
            {profile.onboardingCompleted
              ? "Perfil completo"
              : "Perfil aguardando conclusão"}
          </p>
        </div>
      </section>
    </main>
  )
}
