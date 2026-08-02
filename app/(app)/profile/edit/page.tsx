import type { Metadata } from "next"

import { requireAuth } from "@/lib/require-auth"
import { updateProfileAction } from "@/modules/profile/profile.actions"
import { requireProfileForSession } from "@/modules/profile/profile.service"
import { ProfileForm } from "@/modules/profile/profile-form"

export const metadata: Metadata = {
  title: "Editar perfil",
}

export default async function EditProfilePage() {
  const session = await requireAuth()
  const profile = await requireProfileForSession(session)

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Editar perfil</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Essas informações serão usadas durante o evento.
        </p>
      </section>
      <ProfileForm
        defaultValues={{
          displayName: profile.displayName,
          gender: profile.gender ?? "",
          bio: profile.bio ?? "",
          role: profile.role ?? "",
          company: profile.company ?? "",
          linkedinUsername: profile.linkedinUsername ?? "",
          website: profile.website ?? "",
          skills: [...profile.skills],
        }}
        submitAction={updateProfileAction}
        successRedirect="/profile"
        cancelHref="/profile"
      />
    </div>
  )
}
