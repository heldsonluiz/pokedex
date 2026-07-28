import type { ProfileIdentity, StoredProfileFields } from "./profile.schema"

export type Profile = Readonly<
  ProfileIdentity &
    StoredProfileFields & {
      qrId: string
      onboardingCompleted: boolean
      createdAt: Date
      updatedAt: Date
    }
>
