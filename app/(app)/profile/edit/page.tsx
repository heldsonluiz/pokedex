import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { AppShell } from "@/components/layout/app-shell"
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
    <AppShell
      header={<AppHeader title="Editar perfil" showBack />}
      theme="dark"
    >
      <div className="p-4 px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            Atualize seu perfil
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Essas informações serão usadas durante o evento.
          </p>
        </div>
        <ProfileForm
          defaultValues={{
            displayName: profile.displayName,
            bio: profile.bio ?? "",
            role: profile.role ?? "",
            company: profile.company ?? "",
            link: profile.link ?? "",
            skills: [...profile.skills],
          }}
          submitAction={updateProfileAction}
          successRedirect="/profile"
          cancelHref="/profile"
        />
      </div>
    </AppShell>
  )
}
