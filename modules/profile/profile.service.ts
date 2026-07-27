import "server-only"

import type { Session } from "next-auth"

import { env } from "@/env"

import {
  ensureProfileExists,
  type EnsureProfileResult,
  findProfileByUserId,
  updateProfileByUserId,
} from "./profile.repository"
import {
  type ProfileIdentity,
  profileIdentitySchema,
  profileUpdateSchema,
} from "./profile.schema"
import type { Profile } from "./profile.types"

export function buildProfileIdentity(session: Session): ProfileIdentity {
  const user = session.user

  if (!user) {
    throw new Error("Authenticated session does not contain a user")
  }

  const result = profileIdentitySchema.safeParse({
    userId: user.id,
    eventId: env.EVENT_ID,
    displayName: user.name,
    email: user.email,
    avatarUrl: user.image ?? null,
  })

  if (!result.success) {
    throw new Error(
      "Authenticated session does not contain a valid profile identity"
    )
  }

  return result.data
}

export async function ensureProfileForSession(
  session: Session
): Promise<EnsureProfileResult> {
  const identity = buildProfileIdentity(session)

  return ensureProfileExists(identity)
}

export async function getProfileForSession(
  session: Session
): Promise<Profile | null> {
  const identity = buildProfileIdentity(session)
  const profile = await findProfileByUserId(identity.userId)

  if (!profile) {
    return null
  }

  if (profile.eventId !== identity.eventId) {
    throw new Error("Authenticated profile belongs to a different event")
  }

  return profile
}

export async function requireProfileForSession(
  session: Session
): Promise<Profile> {
  const existingProfile = await getProfileForSession(session)

  if (existingProfile) {
    return existingProfile
  }

  await ensureProfileForSession(session)

  const createdProfile = await getProfileForSession(session)

  if (!createdProfile) {
    throw new Error("Profile could not be created")
  }

  return createdProfile
}

export async function updateProfileForSession(
  session: Session,
  input: unknown
): Promise<Profile> {
  const validatedInput = profileUpdateSchema.parse(input)
  const currentProfile = await requireProfileForSession(session)

  await updateProfileByUserId(currentProfile.userId, validatedInput)

  const updatedProfile = await getProfileForSession(session)

  if (!updatedProfile) {
    throw new Error("Updated profile could not be loaded")
  }

  return updatedProfile
}
