import "server-only"

import {
  FieldPath,
  type Query,
  type QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"

import {
  type RaffleProfileCursor,
  raffleProfileCursorSchema,
} from "./raffle.schema"

const PROFILES_COLLECTION = "profiles"
const RAFFLE_PROFILE_FIELDS = [
  "userId",
  "eventId",
  "displayName",
  "onboardingCompleted",
  "accessRoles",
  "xp",
  "xpReachedAt",
  "ticketBalance",
  "convertedXp",
  "onboardingTicketGranted",
] as const

const profileCursorDocumentSchema = z.object({
  userId: raffleProfileCursorSchema.shape.userId,
  xp: raffleProfileCursorSchema.shape.xp,
  xpReachedAt: z.instanceof(Timestamp).nullable(),
})

function buildIndexedProfileQuery(eventId: string) {
  return firestore
    .collection(PROFILES_COLLECTION)
    .where("eventId", "==", eventId)
    .where("onboardingCompleted", "==", true)
    .where("accessRoles", "array-contains", "participant")
    .orderBy("xp", "desc")
    .orderBy("xpReachedAt", "asc")
    .orderBy("userId", "asc")
}

function applyCursor(query: Query, cursor: RaffleProfileCursor | null): Query {
  if (!cursor) {
    return query
  }

  if (typeof cursor === "string") {
    return query.startAfter(cursor)
  }

  return query.startAfter(
    cursor.xp,
    cursor.xpReachedAtMs === null
      ? null
      : Timestamp.fromMillis(cursor.xpReachedAtMs),
    cursor.userId
  )
}

function createCursor(
  snapshot: QueryDocumentSnapshot,
  legacy: boolean
): RaffleProfileCursor {
  if (legacy) {
    return snapshot.id
  }

  const profile = profileCursorDocumentSchema.parse(snapshot.data())

  if (profile.userId !== snapshot.id) {
    throw new Error("Stored raffle profile identity is invalid")
  }

  return {
    xp: profile.xp,
    xpReachedAtMs: profile.xpReachedAt?.toMillis() ?? null,
    userId: profile.userId,
  }
}

export async function findRaffleProfilePage({
  eventId,
  batchSize,
  cursor,
}: {
  eventId: string
  batchSize: number
  cursor: RaffleProfileCursor | null
}) {
  // Closures started before the indexed cursor was introduced keep their
  // original document-ID pagination so an in-progress snapshot remains safe.
  const legacy = typeof cursor === "string"
  const baseQuery = legacy
    ? firestore
        .collection(PROFILES_COLLECTION)
        .where("eventId", "==", eventId)
        .orderBy(FieldPath.documentId())
    : buildIndexedProfileQuery(eventId)
  const snapshots = await applyCursor(baseQuery, cursor)
    .select(...RAFFLE_PROFILE_FIELDS)
    .limit(batchSize + 1)
    .get()
  const page = snapshots.docs.slice(0, batchSize)
  const lastSnapshot = page.at(-1)

  return {
    snapshots: page,
    reachedEnd: snapshots.size <= batchSize,
    nextCursor: lastSnapshot ? createCursor(lastSnapshot, legacy) : cursor,
  }
}
