import "server-only"

import { createHash } from "node:crypto"

import {
  FieldValue,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"

import {
  type ParticipantSummary,
  type ParticipantSummaryCounter,
  participantSummaryFieldsSchema,
} from "./participant-summary.schema"

const COMPLETIONS_COLLECTION = "activityCompletions"
const CONNECTIONS_COLLECTION = "connections"
const SUMMARIES_COLLECTION = "participantSummaries"

const storedParticipantSummarySchema = participantSummaryFieldsSchema
  .omit({ initializedAt: true, updatedAt: true })
  .extend({
    initializedAt: z.instanceof(Timestamp),
    updatedAt: z.instanceof(Timestamp),
  })

const completionIdentitySchema = z.object({
  eventId: z.string(),
  participantId: z.string(),
  activityType: z.enum(["company", "tag", "mission"]),
})

const connectionIdentitySchema = z.object({
  eventId: z.string(),
  participantIds: z.array(z.string()),
  status: z.string(),
})

export function calculateParticipantSummaryCounts({
  eventId,
  participantId,
  completions,
  connections,
}: {
  eventId: string
  participantId: string
  completions: readonly unknown[]
  connections: readonly unknown[]
}) {
  const counts = {
    connectionsCount: 0,
    companiesVisitedCount: 0,
    tagsDiscoveredCount: 0,
    missionsCompletedCount: 0,
  }

  for (const value of completions) {
    const completion = completionIdentitySchema.safeParse(value)

    if (
      !completion.success ||
      completion.data.eventId !== eventId ||
      completion.data.participantId !== participantId
    ) {
      continue
    }

    if (completion.data.activityType === "company") {
      counts.companiesVisitedCount += 1
    } else if (completion.data.activityType === "tag") {
      counts.tagsDiscoveredCount += 1
    } else {
      counts.missionsCompletedCount += 1
    }
  }

  for (const value of connections) {
    const connection = connectionIdentitySchema.safeParse(value)

    if (
      connection.success &&
      connection.data.eventId === eventId &&
      connection.data.status === "accepted" &&
      connection.data.participantIds.includes(participantId)
    ) {
      counts.connectionsCount += 1
    }
  }

  return counts
}

function getParticipantSummaryId(eventId: string, participantId: string) {
  return createHash("sha256")
    .update(JSON.stringify([eventId, participantId, "summary"]))
    .digest("hex")
}

export function getParticipantSummaryRef(
  eventId: string,
  participantId: string
) {
  return firestore
    .collection(SUMMARIES_COLLECTION)
    .doc(getParticipantSummaryId(eventId, participantId))
}

function parseParticipantSummary(value: unknown): ParticipantSummary {
  const summary = storedParticipantSummarySchema.parse(value)

  return participantSummaryFieldsSchema.parse({
    ...summary,
    initializedAt: summary.initializedAt.toDate(),
    updatedAt: summary.updatedAt.toDate(),
  })
}

export function createInitialParticipantSummary(
  transaction: Transaction,
  eventId: string,
  participantId: string,
  now: Timestamp
) {
  transaction.create(getParticipantSummaryRef(eventId, participantId), {
    eventId,
    participantId,
    connectionsCount: 0,
    companiesVisitedCount: 0,
    tagsDiscoveredCount: 0,
    missionsCompletedCount: 0,
    initializedAt: now,
    updatedAt: now,
  })
}

export function incrementParticipantSummary(
  transaction: Transaction,
  {
    eventId,
    participantId,
    counter,
    amount,
    now,
  }: {
    eventId: string
    participantId: string
    counter: ParticipantSummaryCounter
    amount: 1 | -1
    now: Timestamp
  }
) {
  transaction.set(
    getParticipantSummaryRef(eventId, participantId),
    {
      eventId,
      participantId,
      [counter]: FieldValue.increment(amount),
      updatedAt: now,
    },
    { merge: true }
  )
}

export async function findOrInitializeParticipantSummary(
  eventId: string,
  participantId: string
): Promise<ParticipantSummary> {
  const validatedEventId =
    participantSummaryFieldsSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    participantSummaryFieldsSchema.shape.participantId.parse(participantId)
  const summaryRef = getParticipantSummaryRef(
    validatedEventId,
    validatedParticipantId
  )

  return firestore.runTransaction(async (transaction) => {
    const summarySnapshot = await transaction.get(summaryRef)
    const storedSummary = summarySnapshot.exists
      ? storedParticipantSummarySchema.safeParse(summarySnapshot.data())
      : null

    if (storedSummary?.success) {
      if (
        storedSummary.data.eventId !== validatedEventId ||
        storedSummary.data.participantId !== validatedParticipantId
      ) {
        throw new Error("Stored participant summary identity is invalid")
      }

      return parseParticipantSummary(summarySnapshot.data())
    }

    const completionsQuery = firestore
      .collection(COMPLETIONS_COLLECTION)
      .where("participantId", "==", validatedParticipantId)
    const connectionsQuery = firestore
      .collection(CONNECTIONS_COLLECTION)
      .where("participantIds", "array-contains", validatedParticipantId)
    const [completionSnapshots, connectionSnapshots] = await Promise.all([
      transaction.get(completionsQuery),
      transaction.get(connectionsQuery),
    ])
    const counts = calculateParticipantSummaryCounts({
      eventId: validatedEventId,
      participantId: validatedParticipantId,
      completions: completionSnapshots.docs.map((snapshot) => snapshot.data()),
      connections: connectionSnapshots.docs.map((snapshot) => snapshot.data()),
    })

    const now = Timestamp.now()
    const summary = {
      eventId: validatedEventId,
      participantId: validatedParticipantId,
      ...counts,
      initializedAt: now,
      updatedAt: now,
    }

    transaction.set(summaryRef, summary)

    return participantSummaryFieldsSchema.parse({
      ...summary,
      initializedAt: now.toDate(),
      updatedAt: now.toDate(),
    })
  })
}
