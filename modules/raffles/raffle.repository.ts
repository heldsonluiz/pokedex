import "server-only"

import { createHash, randomInt, randomUUID } from "node:crypto"

import { Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import {
  CONSUME_RAFFLE_WINNER_TICKETS,
  RAFFLE_PREPARATION_BATCH_SIZE,
} from "@/config/raffles"
import { firestore } from "@/lib/firebase/admin"
import { accessRolesSchema } from "@/modules/profile/profile.schema"

import {
  type Raffle,
  type RaffleAttempt,
  raffleAttemptFieldsSchema,
  type RaffleEntryChunk,
  raffleEntryChunkFieldsSchema,
  raffleFieldsSchema,
  storedRaffleProfileCursorSchema,
} from "./raffle.schema"
import {
  calculateRaffleAllocation,
  calculateWinnerTicketDelta,
} from "./raffle-calculator"
import { findRaffleProfilePage } from "./raffle-profile-query"
import { selectWeightedCandidate } from "./weighted-draw"

const EVENT_OPERATIONS_COLLECTION = "eventOperations"
const PROFILES_COLLECTION = "profiles"
const TRANSACTIONS_COLLECTION = "ticketTransactions"
const ENTRY_CHUNKS_COLLECTION = "raffleEntryChunks"
const SKIPPED_PROFILES_COLLECTION = "raffleSkippedProfiles"
const WINNERS_COLLECTION = "raffleWinners"
const RAFFLES_COLLECTION = "raffles"
const ATTEMPTS_COLLECTION = "raffleAttempts"

const participantProfileSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  displayName: z.string().trim().min(1).max(120),
  onboardingCompleted: z.boolean(),
  accessRoles: accessRolesSchema.default(["participant"]),
  xp: z.number().int().nonnegative().default(0),
  ticketBalance: z.number().int().nonnegative().default(0),
  convertedXp: z.number().int().nonnegative().default(0),
  onboardingTicketGranted: z.boolean().default(false),
})

const eventOperationsDocumentSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  ticketConversionEnabled: z.boolean().default(true),
  rewardRedemptionEnabled: z.boolean().default(true),
  raffleClosureStatus: z.enum(["open", "processing", "closed"]).default("open"),
  raffleClosureCursor: storedRaffleProfileCursorSchema.nullable().default(null),
  raffleProcessedParticipants: z.number().int().nonnegative().default(0),
  raffleSkippedParticipants: z.number().int().nonnegative().default(0),
  raffleSnapshotAt: z.instanceof(Timestamp).nullable().default(null),
  raffleClosedAt: z.instanceof(Timestamp).nullable().default(null),
})

const raffleEntryChunkDocumentSchema = raffleEntryChunkFieldsSchema
  .omit({ id: true, snapshotAt: true })
  .extend({ snapshotAt: z.instanceof(Timestamp) })

const raffleDocumentSchema = raffleFieldsSchema
  .omit({ id: true, createdAt: true, updatedAt: true, drawnAt: true })
  .extend({
    createdAt: z.instanceof(Timestamp),
    updatedAt: z.instanceof(Timestamp),
    drawnAt: z.instanceof(Timestamp).nullable(),
  })

const raffleAttemptDocumentSchema = raffleAttemptFieldsSchema
  .omit({ id: true, selectedAt: true, resolvedAt: true })
  .extend({
    selectedAt: z.instanceof(Timestamp),
    resolvedAt: z.instanceof(Timestamp).nullable(),
  })

function deterministicId(parts: readonly string[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex")
}

function parseEntryChunk(id: string, value: unknown): RaffleEntryChunk {
  const document = raffleEntryChunkDocumentSchema.parse(value)

  return raffleEntryChunkFieldsSchema.parse({
    id,
    ...document,
    snapshotAt: document.snapshotAt.toDate(),
  })
}

function parseRaffle(id: string, value: unknown): Raffle {
  const document = raffleDocumentSchema.parse(value)

  return raffleFieldsSchema.parse({
    id,
    ...document,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate(),
    drawnAt: document.drawnAt?.toDate() ?? null,
  })
}

function parseAttempt(id: string, value: unknown): RaffleAttempt {
  const document = raffleAttemptDocumentSchema.parse(value)

  return raffleAttemptFieldsSchema.parse({
    id,
    ...document,
    selectedAt: document.selectedAt.toDate(),
    resolvedAt: document.resolvedAt?.toDate() ?? null,
  })
}

export type RaffleClosureState = Readonly<{
  status: "open" | "processing" | "closed"
  processedParticipants: number
  skippedParticipants: number
  snapshotAt: Date | null
  closedAt: Date | null
}>

export async function findRaffleClosureState(
  eventId: string
): Promise<RaffleClosureState> {
  const validatedEventId = participantProfileSchema.shape.eventId.parse(eventId)
  const snapshot = await firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)
    .get()

  if (!snapshot.exists) {
    return {
      status: "open",
      processedParticipants: 0,
      skippedParticipants: 0,
      snapshotAt: null,
      closedAt: null,
    }
  }

  const operations = eventOperationsDocumentSchema.parse(snapshot.data())

  if (operations.eventId !== validatedEventId) {
    throw new Error("Stored event operations identity is invalid")
  }

  return {
    status: operations.raffleClosureStatus,
    processedParticipants: operations.raffleProcessedParticipants,
    skippedParticipants: operations.raffleSkippedParticipants,
    snapshotAt: operations.raffleSnapshotAt?.toDate() ?? null,
    closedAt: operations.raffleClosedAt?.toDate() ?? null,
  }
}

export async function beginRaffleClosure(eventId: string, operatorId: string) {
  const validatedEventId = participantProfileSchema.shape.eventId.parse(eventId)
  const validatedOperatorId =
    participantProfileSchema.shape.userId.parse(operatorId)
  const reference = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference)
    const current = snapshot.exists
      ? eventOperationsDocumentSchema.parse(snapshot.data())
      : null

    if (current && current.raffleClosureStatus !== "open") {
      return current.raffleClosureStatus
    }

    const now = Timestamp.now()

    transaction.set(
      reference,
      {
        eventId: validatedEventId,
        ticketConversionEnabled: false,
        rewardRedemptionEnabled: false,
        raffleClosureStatus: "processing",
        raffleClosureCursor: null,
        raffleProcessedParticipants: 0,
        raffleSkippedParticipants: 0,
        raffleSnapshotAt: now,
        raffleClosedAt: null,
        updatedAt: now,
        updatedBy: validatedOperatorId,
      },
      { merge: true }
    )

    return "processing" as const
  })
}

export async function processRaffleClosureBatch(
  eventId: string,
  operatorId: string,
  batchSize = RAFFLE_PREPARATION_BATCH_SIZE
) {
  const validatedEventId = participantProfileSchema.shape.eventId.parse(eventId)
  const validatedOperatorId =
    participantProfileSchema.shape.userId.parse(operatorId)
  const validatedBatchSize = z
    .number()
    .int()
    .min(1)
    .max(RAFFLE_PREPARATION_BATCH_SIZE)
    .parse(batchSize)
  const operationsRef = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)
  const operationsSnapshot = await operationsRef.get()

  if (!operationsSnapshot.exists) {
    throw new Error("Raffle closure was not started")
  }

  const operations = eventOperationsDocumentSchema.parse(
    operationsSnapshot.data()
  )

  if (
    operations.eventId !== validatedEventId ||
    operations.raffleClosureStatus !== "processing" ||
    !operations.raffleSnapshotAt
  ) {
    throw new Error("Raffle closure is not processing")
  }

  const profilePage = await findRaffleProfilePage({
    eventId: validatedEventId,
    batchSize: validatedBatchSize,
    cursor: operations.raffleClosureCursor,
  })
  const nextSnapshots = profilePage.snapshots

  if (nextSnapshots.length === 0) {
    await operationsRef.update({
      raffleClosureStatus: "closed",
      raffleClosedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      updatedBy: validatedOperatorId,
    })

    return {
      status: "closed" as const,
      processedParticipants: operations.raffleProcessedParticipants,
      skippedParticipants: operations.raffleSkippedParticipants,
    }
  }

  const participants: Array<{
    reference: (typeof nextSnapshots)[number]["ref"]
    profile: z.infer<typeof participantProfileSchema>
  }> = []
  const skippedSnapshots: typeof nextSnapshots = []

  nextSnapshots.forEach((snapshot) => {
    const parsed = participantProfileSchema.safeParse(snapshot.data())

    if (
      !parsed.success ||
      parsed.data.userId !== snapshot.id ||
      parsed.data.eventId !== validatedEventId ||
      !parsed.data.onboardingCompleted ||
      !parsed.data.accessRoles.includes("participant")
    ) {
      skippedSnapshots.push(snapshot)
      return
    }

    participants.push({ reference: snapshot.ref, profile: parsed.data })
  })
  const writeBatch = firestore.batch()
  const chunkParticipants: Array<{
    participantId: string
    participantName: string
    ticketWeight: number
    balanceTickets: number
    autoConvertedTickets: number
  }> = []

  participants.forEach(({ reference, profile }) => {
    const hasOnboardingGrant = profile.onboardingTicketGranted
    const allocation = calculateRaffleAllocation({
      xp: profile.xp,
      convertedXp: profile.convertedXp,
      ticketBalance: profile.ticketBalance,
      hasOnboardingGrant,
    })
    const nextTicketBalance =
      profile.ticketBalance +
      allocation.onboardingTickets +
      allocation.autoConvertedTickets

    if (!hasOnboardingGrant) {
      const onboardingRef = firestore
        .collection(TRANSACTIONS_COLLECTION)
        .doc(
          deterministicId([
            validatedEventId,
            profile.userId,
            "onboarding_grant",
          ])
        )

      writeBatch.create(onboardingRef, {
        eventId: validatedEventId,
        participantId: profile.userId,
        type: "onboarding_grant",
        ticketDelta: allocation.onboardingTickets,
        convertedXp: 0,
        operatorId: profile.userId,
        referenceType: "onboarding",
        referenceId: profile.userId,
        createdAt: operations.raffleSnapshotAt,
      })
    }

    if (allocation.autoConvertedTickets > 0) {
      const conversionRef = firestore
        .collection(TRANSACTIONS_COLLECTION)
        .doc(
          deterministicId([
            validatedEventId,
            profile.userId,
            "raffle_final_conversion",
          ])
        )

      writeBatch.create(conversionRef, {
        eventId: validatedEventId,
        participantId: profile.userId,
        type: "xp_conversion",
        ticketDelta: allocation.autoConvertedTickets,
        convertedXp: allocation.autoConvertedXp,
        operatorId: validatedOperatorId,
        referenceType: "raffle_closure",
        referenceId: validatedEventId,
        createdAt: operations.raffleSnapshotAt,
      })
    }

    writeBatch.update(reference, {
      ticketBalance: nextTicketBalance,
      convertedXp: profile.convertedXp + allocation.autoConvertedXp,
      onboardingTicketGranted: true,
      updatedAt: operations.raffleSnapshotAt,
    })
    chunkParticipants.push({
      participantId: profile.userId,
      participantName: profile.displayName,
      ticketWeight: allocation.ticketWeight,
      balanceTickets: nextTicketBalance,
      autoConvertedTickets: allocation.autoConvertedTickets,
    })
  })

  if (chunkParticipants.length > 0) {
    const chunkId = deterministicId([
      validatedEventId,
      nextSnapshots.at(-1)?.id ?? randomUUID(),
      "raffle_entry_chunk",
    ])

    writeBatch.create(
      firestore.collection(ENTRY_CHUNKS_COLLECTION).doc(chunkId),
      {
        eventId: validatedEventId,
        snapshotAt: operations.raffleSnapshotAt,
        participants: chunkParticipants,
      }
    )
  }

  skippedSnapshots.forEach((snapshot) => {
    writeBatch.create(
      firestore
        .collection(SKIPPED_PROFILES_COLLECTION)
        .doc(
          deterministicId([
            validatedEventId,
            snapshot.id,
            "raffle_skipped_profile",
          ])
        ),
      {
        eventId: validatedEventId,
        participantId: snapshot.id,
        reason: "INVALID_PROFILE",
        snapshotAt: operations.raffleSnapshotAt,
        createdAt: operations.raffleSnapshotAt,
      }
    )
  })

  const processedParticipants =
    operations.raffleProcessedParticipants + nextSnapshots.length
  const skippedParticipants =
    operations.raffleSkippedParticipants + skippedSnapshots.length
  const reachedEnd = profilePage.reachedEnd
  const now = Timestamp.now()

  writeBatch.update(operationsRef, {
    raffleClosureCursor: profilePage.nextCursor,
    raffleProcessedParticipants: processedParticipants,
    raffleSkippedParticipants: skippedParticipants,
    raffleClosureStatus: reachedEnd ? "closed" : "processing",
    raffleClosedAt: reachedEnd ? now : null,
    updatedAt: now,
    updatedBy: validatedOperatorId,
  })
  await writeBatch.commit()

  return {
    status: reachedEnd ? ("closed" as const) : ("processing" as const),
    processedParticipants,
    skippedParticipants,
  }
}

export async function findRaffles(eventId: string) {
  const validatedEventId = participantProfileSchema.shape.eventId.parse(eventId)
  const snapshots = await firestore
    .collection(RAFFLES_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .get()

  return snapshots.docs
    .map((snapshot) => parseRaffle(snapshot.id, snapshot.data()))
    .filter((raffle) => raffle.active)
    .sort((first, second) => first.order - second.order)
}

async function findEligibleEntries(eventId: string) {
  const [chunkSnapshots, winnerSnapshots] = await Promise.all([
    firestore
      .collection(ENTRY_CHUNKS_COLLECTION)
      .where("eventId", "==", eventId)
      .get(),
    firestore
      .collection(WINNERS_COLLECTION)
      .where("eventId", "==", eventId)
      .get(),
  ])
  const winnerIds = new Set(
    winnerSnapshots.docs.map(
      (snapshot) => snapshot.data().participantId as string
    )
  )

  return chunkSnapshots.docs
    .flatMap(
      (snapshot) => parseEntryChunk(snapshot.id, snapshot.data()).participants
    )
    .filter(
      (entry) => !winnerIds.has(entry.participantId) && entry.ticketWeight > 0
    )
}

async function findRaffleAttempts(raffleId: string) {
  const snapshots = await firestore
    .collection(ATTEMPTS_COLLECTION)
    .where("raffleId", "==", raffleId)
    .get()

  return snapshots.docs.map((snapshot) =>
    parseAttempt(snapshot.id, snapshot.data())
  )
}

export async function drawRaffle(
  eventId: string,
  raffleId: string,
  operatorId: string
) {
  const validatedEventId = participantProfileSchema.shape.eventId.parse(eventId)
  const validatedRaffleId = raffleFieldsSchema.shape.id.parse(raffleId)
  const validatedOperatorId =
    participantProfileSchema.shape.userId.parse(operatorId)
  const operationsRef = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)
  const raffleRef = firestore
    .collection(RAFFLES_COLLECTION)
    .doc(validatedRaffleId)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [entries, previousAttempts] = await Promise.all([
      findEligibleEntries(validatedEventId),
      findRaffleAttempts(validatedRaffleId),
    ])
    const attemptedParticipantIds = new Set(
      previousAttempts
        .filter((item) => item.eventId === validatedEventId)
        .map((item) => item.participantId)
    )
    const candidates = entries.filter(
      (entry) => !attemptedParticipantIds.has(entry.participantId)
    )
    const totalWeight = candidates.reduce(
      (total, candidate) => total + candidate.ticketWeight,
      0
    )

    if (totalWeight <= 0) {
      return { status: "no-eligible-participants" as const }
    }

    const randomOffset = randomInt(totalWeight)
    const winner = selectWeightedCandidate(candidates, randomOffset)

    if (!winner) {
      throw new Error("Weighted raffle did not select a participant")
    }

    const attemptId = deterministicId([
      validatedEventId,
      validatedRaffleId,
      randomUUID(),
    ])
    const attemptRef = firestore.collection(ATTEMPTS_COLLECTION).doc(attemptId)
    const result = await firestore.runTransaction(async (transaction) => {
      const [operationsSnapshot, raffleSnapshot] = await Promise.all([
        transaction.get(operationsRef),
        transaction.get(raffleRef),
      ])

      if (!operationsSnapshot.exists || !raffleSnapshot.exists) {
        return "unavailable" as const
      }

      const operations = eventOperationsDocumentSchema.parse(
        operationsSnapshot.data()
      )
      const raffle = parseRaffle(raffleSnapshot.id, raffleSnapshot.data())

      if (
        operations.raffleClosureStatus !== "closed" ||
        raffle.eventId !== validatedEventId ||
        !raffle.active
      ) {
        return "unavailable" as const
      }

      if (raffle.status === "drawn") {
        return "already-drawn" as const
      }

      if (raffle.status === "awaiting_confirmation") {
        return "awaiting-confirmation" as const
      }

      if (attemptedParticipantIds.has(winner.participantId)) {
        return "retry" as const
      }

      const now = Timestamp.now()

      transaction.update(raffleRef, {
        status: "awaiting_confirmation",
        currentAttemptId: attemptId,
        currentCandidateId: winner.participantId,
        currentCandidateName: winner.participantName,
        eligibleParticipantCount: candidates.length,
        eligibleTicketTotal: totalWeight,
        randomOffset,
        updatedAt: now,
      })
      transaction.create(attemptRef, {
        eventId: validatedEventId,
        raffleId: validatedRaffleId,
        participantId: winner.participantId,
        participantName: winner.participantName,
        ticketWeight: winner.ticketWeight,
        eligibleParticipantCount: candidates.length,
        eligibleTicketTotal: totalWeight,
        randomOffset,
        status: "pending",
        selectedAt: now,
        selectedBy: validatedOperatorId,
        resolvedAt: null,
        resolvedBy: null,
      })

      return "candidate-selected" as const
    })

    if (result !== "retry") {
      return { status: result, candidateName: winner.participantName }
    }
  }

  throw new Error("Raffle draw conflicted too many times")
}

export async function confirmRaffleWinner(
  eventId: string,
  raffleId: string,
  operatorId: string,
  expectedAttemptId: string
) {
  const validatedEventId = participantProfileSchema.shape.eventId.parse(eventId)
  const validatedRaffleId = raffleFieldsSchema.shape.id.parse(raffleId)
  const validatedOperatorId =
    participantProfileSchema.shape.userId.parse(operatorId)
  const validatedAttemptId =
    raffleAttemptFieldsSchema.shape.id.parse(expectedAttemptId)
  const operationsRef = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)
  const raffleRef = firestore
    .collection(RAFFLES_COLLECTION)
    .doc(validatedRaffleId)

  return firestore.runTransaction(async (transaction) => {
    const [operationsSnapshot, raffleSnapshot] = await Promise.all([
      transaction.get(operationsRef),
      transaction.get(raffleRef),
    ])

    if (!operationsSnapshot.exists || !raffleSnapshot.exists) {
      return "unavailable" as const
    }

    const operations = eventOperationsDocumentSchema.parse(
      operationsSnapshot.data()
    )
    const raffle = parseRaffle(raffleSnapshot.id, raffleSnapshot.data())

    if (
      operations.raffleClosureStatus !== "closed" ||
      raffle.eventId !== validatedEventId ||
      !raffle.active ||
      raffle.status !== "awaiting_confirmation" ||
      !raffle.currentAttemptId ||
      raffle.currentAttemptId !== validatedAttemptId ||
      !raffle.currentCandidateId
    ) {
      return "unavailable" as const
    }

    const attemptRef = firestore
      .collection(ATTEMPTS_COLLECTION)
      .doc(raffle.currentAttemptId)
    const winnerRef = firestore
      .collection(WINNERS_COLLECTION)
      .doc(
        deterministicId([
          validatedEventId,
          raffle.currentCandidateId,
          "raffle_winner",
        ])
      )
    const profileRef = firestore
      .collection(PROFILES_COLLECTION)
      .doc(raffle.currentCandidateId)
    const consumptionRef = firestore
      .collection(TRANSACTIONS_COLLECTION)
      .doc(
        deterministicId([
          validatedEventId,
          raffle.currentCandidateId,
          "raffle_winner_consumption",
          validatedRaffleId,
        ])
      )
    const [
      attemptSnapshot,
      winnerSnapshot,
      profileSnapshot,
      consumptionSnapshot,
    ] = await Promise.all([
      transaction.get(attemptRef),
      transaction.get(winnerRef),
      transaction.get(profileRef),
      transaction.get(consumptionRef),
    ])

    if (
      !attemptSnapshot.exists ||
      winnerSnapshot.exists ||
      !profileSnapshot.exists
    ) {
      return "unavailable" as const
    }

    const raffleAttempt = parseAttempt(
      attemptSnapshot.id,
      attemptSnapshot.data()
    )
    const winnerProfile = participantProfileSchema.parse(profileSnapshot.data())

    if (
      raffleAttempt.status !== "pending" ||
      raffleAttempt.raffleId !== validatedRaffleId ||
      raffleAttempt.participantId !== raffle.currentCandidateId ||
      winnerProfile.userId !== raffle.currentCandidateId ||
      winnerProfile.eventId !== validatedEventId
    ) {
      return "unavailable" as const
    }

    if (
      CONSUME_RAFFLE_WINNER_TICKETS &&
      winnerProfile.ticketBalance > 0 &&
      consumptionSnapshot.exists
    ) {
      return "unavailable" as const
    }

    const now = Timestamp.now()
    const winnerTicketDelta = calculateWinnerTicketDelta(
      winnerProfile.ticketBalance,
      CONSUME_RAFFLE_WINNER_TICKETS
    )

    transaction.update(raffleRef, {
      status: "drawn",
      winnerId: raffleAttempt.participantId,
      winnerName: raffleAttempt.participantName,
      drawnAt: now,
      drawnBy: validatedOperatorId,
      updatedAt: now,
    })
    transaction.update(attemptRef, {
      status: "confirmed",
      resolvedAt: now,
      resolvedBy: validatedOperatorId,
    })
    transaction.create(winnerRef, {
      eventId: validatedEventId,
      participantId: raffleAttempt.participantId,
      participantName: raffleAttempt.participantName,
      raffleId: validatedRaffleId,
      confirmedAt: now,
      confirmedBy: validatedOperatorId,
    })

    if (winnerTicketDelta < 0) {
      transaction.create(consumptionRef, {
        eventId: validatedEventId,
        participantId: raffleAttempt.participantId,
        type: "adjustment",
        ticketDelta: winnerTicketDelta,
        convertedXp: 0,
        operatorId: validatedOperatorId,
        referenceType: "raffle_winner",
        referenceId: validatedRaffleId,
        createdAt: now,
      })
      transaction.update(profileRef, {
        ticketBalance: 0,
        updatedAt: now,
      })
    }

    return "confirmed" as const
  })
}

export async function rerollRaffle(
  eventId: string,
  raffleId: string,
  operatorId: string,
  expectedAttemptId: string
) {
  const validatedEventId = participantProfileSchema.shape.eventId.parse(eventId)
  const validatedRaffleId = raffleFieldsSchema.shape.id.parse(raffleId)
  const validatedOperatorId =
    participantProfileSchema.shape.userId.parse(operatorId)
  const validatedAttemptId =
    raffleAttemptFieldsSchema.shape.id.parse(expectedAttemptId)
  const raffleRef = firestore
    .collection(RAFFLES_COLLECTION)
    .doc(validatedRaffleId)
  const released = await firestore.runTransaction(async (transaction) => {
    const raffleSnapshot = await transaction.get(raffleRef)

    if (!raffleSnapshot.exists) {
      return false
    }

    const raffle = parseRaffle(raffleSnapshot.id, raffleSnapshot.data())

    if (
      raffle.eventId !== validatedEventId ||
      raffle.status !== "awaiting_confirmation" ||
      raffle.currentAttemptId !== validatedAttemptId
    ) {
      return false
    }

    const attemptRef = firestore
      .collection(ATTEMPTS_COLLECTION)
      .doc(validatedAttemptId)
    const attemptSnapshot = await transaction.get(attemptRef)

    if (!attemptSnapshot.exists) {
      return false
    }

    const raffleAttempt = parseAttempt(
      attemptSnapshot.id,
      attemptSnapshot.data()
    )

    if (
      raffleAttempt.status !== "pending" ||
      raffleAttempt.raffleId !== validatedRaffleId
    ) {
      return false
    }

    const now = Timestamp.now()

    transaction.update(attemptRef, {
      status: "absent",
      resolvedAt: now,
      resolvedBy: validatedOperatorId,
    })
    transaction.update(raffleRef, {
      status: "pending",
      currentAttemptId: null,
      currentCandidateId: null,
      currentCandidateName: null,
      updatedAt: now,
    })

    return true
  })

  if (!released) {
    return { status: "unavailable" as const }
  }

  return drawRaffle(validatedEventId, validatedRaffleId, validatedOperatorId)
}

export async function setPostRaffleRedemptionsEnabled(
  eventId: string,
  operatorId: string,
  enabled: boolean
) {
  const validatedEventId = participantProfileSchema.shape.eventId.parse(eventId)
  const validatedOperatorId =
    participantProfileSchema.shape.userId.parse(operatorId)
  const validatedEnabled = z.boolean().parse(enabled)
  const raffles = await findRaffles(validatedEventId)

  if (
    validatedEnabled &&
    (raffles.length === 0 ||
      raffles.some((raffle) => raffle.status !== "drawn"))
  ) {
    return "raffles-pending" as const
  }

  const operationsRef = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(operationsRef)

    if (!snapshot.exists) {
      return "unavailable" as const
    }

    const operations = eventOperationsDocumentSchema.parse(snapshot.data())

    if (
      operations.eventId !== validatedEventId ||
      operations.raffleClosureStatus !== "closed"
    ) {
      return "unavailable" as const
    }

    transaction.update(operationsRef, {
      rewardRedemptionEnabled: validatedEnabled,
      updatedAt: Timestamp.now(),
      updatedBy: validatedOperatorId,
    })

    return "updated" as const
  })
}
