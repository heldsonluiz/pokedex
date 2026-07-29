import "server-only"

import { Timestamp } from "firebase-admin/firestore"
import { unstable_cache } from "next/cache"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"
import { accessRolesSchema } from "@/modules/profile/profile.schema"

const PROFILES_COLLECTION = "profiles"
const RANKING_CACHE_SECONDS = 60

const rankingProfileDocumentSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  displayName: z.string().trim().min(1).max(120),
  avatarUrl: z.url().nullable(),
  onboardingCompleted: z.boolean(),
  accessRoles: accessRolesSchema.default(["participant"]),
  xp: z.number().int().nonnegative().default(0),
  xpReachedAt: z.instanceof(Timestamp),
})

export type RankingProfile = Readonly<{
  userId: string
  displayName: string
  avatarUrl: string | null
  xp: number
  xpReachedAtMs: number
}>

export type PositionedRankingProfile = Omit<RankingProfile, "xpReachedAtMs"> &
  Readonly<{ position: number }>

export type RankingWindow = Readonly<{
  current: PositionedRankingProfile
  top: PositionedRankingProfile[]
  nearby: PositionedRankingProfile[]
}>

function toPositionedProfile(
  profile: RankingProfile,
  position: number
): PositionedRankingProfile {
  const { xpReachedAtMs: _xpReachedAtMs, ...visibleProfile } = profile

  return { ...visibleProfile, position }
}

async function loadRankedProfiles(eventId: string): Promise<RankingProfile[]> {
  const validatedEventId = z.string().trim().min(1).max(128).parse(eventId)
  const snapshots = await firestore
    .collection(PROFILES_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .get()
  const profiles: RankingProfile[] = []

  for (const snapshot of snapshots.docs) {
    const profile = rankingProfileDocumentSchema.parse(snapshot.data())

    if (
      profile.userId !== snapshot.id ||
      profile.eventId !== validatedEventId
    ) {
      throw new Error("Stored ranking profile is invalid")
    }

    if (
      !profile.onboardingCompleted ||
      !profile.accessRoles.includes("participant")
    ) {
      continue
    }

    profiles.push({
      userId: profile.userId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      xp: profile.xp,
      xpReachedAtMs: profile.xpReachedAt.toMillis(),
    })
  }

  return profiles.sort(
    (first, second) =>
      second.xp - first.xp ||
      first.xpReachedAtMs - second.xpReachedAtMs ||
      first.userId.localeCompare(second.userId)
  )
}

const loadCachedRankedProfiles = unstable_cache(
  loadRankedProfiles,
  ["event-ranking-profiles"],
  {
    revalidate: RANKING_CACHE_SECONDS,
    tags: ["ranking"],
  }
)

export async function findRankingWindow(
  eventId: string,
  participantId: string
): Promise<RankingWindow | null> {
  const validatedParticipantId = z
    .string()
    .trim()
    .min(1)
    .max(128)
    .parse(participantId)
  const profiles = await loadCachedRankedProfiles(eventId)

  return buildRankingWindow(profiles, validatedParticipantId)
}

export function buildRankingWindow(
  profiles: RankingProfile[],
  participantId: string
): RankingWindow | null {
  const currentIndex = profiles.findIndex(
    (profile) => profile.userId === participantId
  )

  if (currentIndex === -1) {
    return null
  }

  const position = currentIndex + 1
  const current = toPositionedProfile(profiles[currentIndex], position)

  if (position <= 3) {
    return {
      current,
      top: profiles
        .slice(0, 10)
        .map((profile, index) => toPositionedProfile(profile, index + 1)),
      nearby: [],
    }
  }

  const nearbyStart = Math.max(3, currentIndex - 3)
  const nearbyEnd = Math.min(profiles.length, currentIndex + 4)

  return {
    current,
    top: profiles
      .slice(0, 3)
      .map((profile, index) => toPositionedProfile(profile, index + 1)),
    nearby: profiles
      .slice(nearbyStart, nearbyEnd)
      .map((profile, index) =>
        toPositionedProfile(profile, nearbyStart + index + 1)
      ),
  }
}
