import type { ProfileIdentity, StoredProfileFields } from "./profile.schema"

export type Profile = Readonly<
  ProfileIdentity &
    StoredProfileFields & {
      qrId: string
      onboardingCompleted: boolean
      xp: number
      xpReachedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }
>
