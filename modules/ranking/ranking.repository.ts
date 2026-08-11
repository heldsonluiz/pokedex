import "server-only"

import { Timestamp } from "firebase-admin/firestore"
import { unstable_cache } from "next/cache"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"
import { getFirestoreCollectionName } from "@/lib/firebase/firestore-collection"
import { accessRolesSchema } from "@/modules/profile/profile.schema"

const PROFILES_COLLECTION = getFirestoreCollectionName("profiles")
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

function parseRankingProfile(
  snapshot: Readonly<{ id: string; data(): unknown }>,
  eventId: string
): RankingProfile {
  const profile = rankingProfileDocumentSchema.parse(snapshot.data())

  if (profile.userId !== snapshot.id || profile.eventId !== eventId) {
    throw new Error("Stored ranking profile is invalid")
  }

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    xp: profile.xp,
    xpReachedAtMs: profile.xpReachedAt.toMillis(),
  }
}

async function loadRankedProfiles(eventId: string): Promise<RankingProfile[]> {
  const validatedEventId = z.string().trim().min(1).max(128).parse(eventId)
  const snapshots = await firestore
    .collection(PROFILES_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .get()
  const profiles: RankingProfile[] = []

  for (const snapshot of snapshots.docs) {
    const storedProfile = rankingProfileDocumentSchema.parse(snapshot.data())

    if (
      !storedProfile.onboardingCompleted ||
      !storedProfile.accessRoles.includes("participant")
    ) {
      continue
    }

    profiles.push(parseRankingProfile(snapshot, validatedEventId))
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
  currentProfile: RankingProfile
): Promise<RankingWindow | null> {
  const validatedEventId = z.string().trim().min(1).max(128).parse(eventId)
  const validatedCurrentProfile = z
    .object({
      userId: rankingProfileDocumentSchema.shape.userId,
      displayName: rankingProfileDocumentSchema.shape.displayName,
      avatarUrl: rankingProfileDocumentSchema.shape.avatarUrl,
      xp: rankingProfileDocumentSchema.shape.xp,
      xpReachedAtMs: z.number().int().nonnegative(),
    })
    .parse(currentProfile)

  try {
    return await findIndexedRankingWindow(
      validatedEventId,
      validatedCurrentProfile
    )
  } catch (error) {
    if (!isMissingRankingIndexError(error)) {
      throw error
    }

    console.warn(
      "Ranking index is unavailable; using the temporary full-profile fallback"
    )
    const profiles = await loadCachedRankedProfiles(validatedEventId)

    return buildRankingWindow(profiles, validatedCurrentProfile.userId)
  }
}

async function findIndexedRankingWindow(
  eventId: string,
  currentProfile: RankingProfile
): Promise<RankingWindow> {
  const query = firestore
    .collection(PROFILES_COLLECTION)
    .where("eventId", "==", eventId)
    .where("onboardingCompleted", "==", true)
    .where("accessRoles", "array-contains", "participant")
    .orderBy("xp", "desc")
    .orderBy("xpReachedAt", "asc")
    .orderBy("userId", "asc")
  const cursor = [
    currentProfile.xp,
    Timestamp.fromMillis(currentProfile.xpReachedAtMs),
    currentProfile.userId,
  ] as const
  const positionSnapshot = await query
    .endBefore(...cursor)
    .count()
    .get()
  const position = positionSnapshot.data().count + 1

  if (position <= 3) {
    const topSnapshot = await query.limit(10).get()

    return buildIndexedRankingWindow({
      current: currentProfile,
      position,
      top: topSnapshot.docs.map((snapshot) =>
        parseRankingProfile(snapshot, eventId)
      ),
      above: [],
      below: [],
    })
  }

  const aboveCount = Math.min(3, Math.max(0, position - 4))
  const [topSnapshot, aboveSnapshot, belowSnapshot] = await Promise.all([
    query.limit(3).get(),
    aboveCount > 0
      ? query
          .endBefore(...cursor)
          .limitToLast(aboveCount)
          .get()
      : Promise.resolve(null),
    query
      .startAfter(...cursor)
      .limit(3)
      .get(),
  ])

  return buildIndexedRankingWindow({
    current: currentProfile,
    position,
    top: topSnapshot.docs.map((snapshot) =>
      parseRankingProfile(snapshot, eventId)
    ),
    above:
      aboveSnapshot?.docs.map((snapshot) =>
        parseRankingProfile(snapshot, eventId)
      ) ?? [],
    below: belowSnapshot.docs.map((snapshot) =>
      parseRankingProfile(snapshot, eventId)
    ),
  })
}

export function buildIndexedRankingWindow({
  current,
  position,
  top,
  above,
  below,
}: {
  current: RankingProfile
  position: number
  top: RankingProfile[]
  above: RankingProfile[]
  below: RankingProfile[]
}): RankingWindow {
  return {
    current: toPositionedProfile(current, position),
    top: top.map((profile, index) => toPositionedProfile(profile, index + 1)),
    nearby:
      position <= 3
        ? []
        : [
            ...above.map((profile, index) =>
              toPositionedProfile(profile, position - above.length + index)
            ),
            toPositionedProfile(current, position),
            ...below.map((profile, index) =>
              toPositionedProfile(profile, position + index + 1)
            ),
          ],
  }
}

function isMissingRankingIndexError(error: unknown) {
  const result = z
    .object({ code: z.union([z.literal(9), z.literal("failed-precondition")]) })
    .safeParse(error)

  return result.success
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
