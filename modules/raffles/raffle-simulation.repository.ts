import "server-only"

import { createHash, randomInt, randomUUID } from "node:crypto"

import { FieldPath, Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import { CONSUME_RAFFLE_WINNER_TICKETS } from "@/config/raffles"
import { firestore } from "@/lib/firebase/admin"
import { accessRolesSchema } from "@/modules/profile/profile.schema"

import {
  type Raffle,
  type RaffleAttempt,
  raffleAttemptFieldsSchema,
  type RaffleEntryChunk,
  raffleEntryChunkFieldsSchema,
  raffleFieldsSchema,
} from "./raffle.schema"
import { calculateRaffleAllocation } from "./raffle-calculator"
import {
  type RaffleSimulation,
  raffleSimulationFieldsSchema,
} from "./raffle-simulation.schema"
import { selectWeightedCandidate } from "./weighted-draw"

const OPERATIONS_COLLECTION = "eventOperations"
const PROFILES_COLLECTION = "profiles"
const TRANSACTIONS_COLLECTION = "ticketTransactions"
const RAFFLES_COLLECTION = "raffles"
const SIMULATIONS_COLLECTION = "raffleTestRuns"
const DEFAULT_BATCH_SIZE = 100

const profileSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  displayName: z.string().trim().min(1).max(120),
  onboardingCompleted: z.boolean(),
  accessRoles: accessRolesSchema.default(["participant"]),
  xp: z.number().int().nonnegative().default(0),
  ticketBalance: z.number().int().nonnegative().default(0),
  convertedXp: z.number().int().nonnegative().default(0),
  onboardingTicketGranted: z.boolean().nullable().default(null),
})

const simulationDocumentSchema = raffleSimulationFieldsSchema
  .omit({ id: true, snapshotAt: true, createdAt: true, archivedAt: true })
  .extend({
    snapshotAt: z.instanceof(Timestamp),
    createdAt: z.instanceof(Timestamp),
    archivedAt: z.instanceof(Timestamp).nullable(),
  })

const raffleDocumentSchema = raffleFieldsSchema
  .omit({ id: true, createdAt: true, updatedAt: true, drawnAt: true })
  .extend({
    createdAt: z.instanceof(Timestamp),
    updatedAt: z.instanceof(Timestamp),
    drawnAt: z.instanceof(Timestamp).nullable(),
  })

const entryChunkDocumentSchema = raffleEntryChunkFieldsSchema
  .omit({ id: true, snapshotAt: true })
  .extend({ snapshotAt: z.instanceof(Timestamp) })

const attemptDocumentSchema = raffleAttemptFieldsSchema
  .omit({ id: true, selectedAt: true, resolvedAt: true })
  .extend({
    selectedAt: z.instanceof(Timestamp),
    resolvedAt: z.instanceof(Timestamp).nullable(),
  })

function deterministicId(parts: readonly string[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex")
}

function simulationRef(runId: string) {
  return firestore.collection(SIMULATIONS_COLLECTION).doc(runId)
}

function parseSimulation(id: string, value: unknown): RaffleSimulation {
  const document = simulationDocumentSchema.parse(value)

  return raffleSimulationFieldsSchema.parse({
    id,
    ...document,
    snapshotAt: document.snapshotAt.toDate(),
    createdAt: document.createdAt.toDate(),
    archivedAt: document.archivedAt?.toDate() ?? null,
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

function parseEntryChunk(id: string, value: unknown): RaffleEntryChunk {
  const document = entryChunkDocumentSchema.parse(value)

  return raffleEntryChunkFieldsSchema.parse({
    id,
    ...document,
    snapshotAt: document.snapshotAt.toDate(),
  })
}

function parseAttempt(id: string, value: unknown): RaffleAttempt {
  const document = attemptDocumentSchema.parse(value)

  return raffleAttemptFieldsSchema.parse({
    id,
    ...document,
    selectedAt: document.selectedAt.toDate(),
    resolvedAt: document.resolvedAt?.toDate() ?? null,
  })
}

export async function findActiveRaffleSimulation(
  eventId: string
): Promise<RaffleSimulation | null> {
  const validatedEventId = profileSchema.shape.eventId.parse(eventId)
  const operationsSnapshot = await firestore
    .collection(OPERATIONS_COLLECTION)
    .doc(validatedEventId)
    .get()
  const runId = operationsSnapshot.data()?.raffleSimulationRunId

  if (typeof runId !== "string") {
    return null
  }

  const snapshot = await simulationRef(runId).get()

  if (!snapshot.exists) {
    throw new Error("Active raffle simulation does not exist")
  }

  const simulation = parseSimulation(snapshot.id, snapshot.data())

  if (
    simulation.eventId !== validatedEventId ||
    simulation.status === "archived"
  ) {
    throw new Error("Active raffle simulation identity is invalid")
  }

  return simulation
}

export async function startRaffleSimulation(
  eventId: string,
  operatorId: string
) {
  const validatedEventId = profileSchema.shape.eventId.parse(eventId)
  const validatedOperatorId = profileSchema.shape.userId.parse(operatorId)
  const current = await findActiveRaffleSimulation(validatedEventId)

  if (current) {
    return current
  }

  const realRaffles = await firestore
    .collection(RAFFLES_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .get()
  const runId = randomUUID()
  const runRef = simulationRef(runId)
  const operationsRef = firestore
    .collection(OPERATIONS_COLLECTION)
    .doc(validatedEventId)
  const now = Timestamp.now()
  const batch = firestore.batch()

  batch.create(runRef, {
    eventId: validatedEventId,
    status: "preparing",
    snapshotFormat: "chunked-v1",
    cursor: null,
    processedParticipants: 0,
    rewardRedemptionEnabled: false,
    snapshotAt: now,
    createdAt: now,
    createdBy: validatedOperatorId,
    archivedAt: null,
    archivedBy: null,
  })
  batch.set(
    operationsRef,
    {
      eventId: validatedEventId,
      raffleSimulationRunId: runId,
      updatedAt: now,
      updatedBy: validatedOperatorId,
    },
    { merge: true }
  )

  realRaffles.docs.forEach((snapshot) => {
    const raffle = parseRaffle(snapshot.id, snapshot.data())

    if (!raffle.active) {
      return
    }

    batch.create(runRef.collection("raffles").doc(raffle.id), {
      eventId: validatedEventId,
      prizeName: raffle.prizeName,
      description: raffle.description,
      imageUrl: raffle.imageUrl,
      order: raffle.order,
      active: true,
      status: "pending",
      currentAttemptId: null,
      currentCandidateId: null,
      currentCandidateName: null,
      winnerId: null,
      winnerName: null,
      eligibleParticipantCount: null,
      eligibleTicketTotal: null,
      randomOffset: null,
      drawnAt: null,
      drawnBy: null,
      createdAt: now,
      updatedAt: now,
    })
  })
  await batch.commit()

  return parseSimulation(runId, {
    eventId: validatedEventId,
    status: "preparing",
    snapshotFormat: "chunked-v1",
    cursor: null,
    processedParticipants: 0,
    rewardRedemptionEnabled: false,
    snapshotAt: now,
    createdAt: now,
    createdBy: validatedOperatorId,
    archivedAt: null,
    archivedBy: null,
  })
}

export async function processRaffleSimulationBatch(
  eventId: string,
  operatorId: string,
  batchSize = DEFAULT_BATCH_SIZE
) {
  const validatedEventId = profileSchema.shape.eventId.parse(eventId)
  profileSchema.shape.userId.parse(operatorId)
  const validatedBatchSize = z.number().int().min(1).max(100).parse(batchSize)
  const simulation = await findActiveRaffleSimulation(validatedEventId)

  if (
    !simulation ||
    simulation.status !== "preparing" ||
    simulation.snapshotFormat !== "chunked-v1"
  ) {
    throw new Error("Raffle simulation is not preparing")
  }

  const runRef = simulationRef(simulation.id)
  const profileQuery = firestore
    .collection(PROFILES_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .orderBy(FieldPath.documentId())
    .limit(validatedBatchSize + 1)
  const profileSnapshots = await (
    simulation.cursor
      ? profileQuery.startAfter(simulation.cursor)
      : profileQuery
  ).get()
  const nextSnapshots = profileSnapshots.docs.slice(0, validatedBatchSize)

  if (nextSnapshots.length === 0) {
    await runRef.update({ status: "ready" })
    return {
      status: "ready" as const,
      processedParticipants: simulation.processedParticipants,
    }
  }

  const participants = nextSnapshots.flatMap((snapshot) => {
    const parsed = profileSchema.safeParse(snapshot.data())

    return parsed.success &&
      parsed.data.userId === snapshot.id &&
      parsed.data.onboardingCompleted &&
      parsed.data.accessRoles.includes("participant")
      ? [parsed.data]
      : []
  })
  const legacyParticipants = participants.filter(
    (profile) => profile.onboardingTicketGranted === null
  )
  const onboardingRefs = legacyParticipants.map((profile) =>
    firestore
      .collection(TRANSACTIONS_COLLECTION)
      .doc(
        deterministicId([validatedEventId, profile.userId, "onboarding_grant"])
      )
  )
  const onboardingSnapshots = await Promise.all(
    onboardingRefs.map((reference) => reference.get())
  )
  const legacyGrantByParticipant = new Map(
    legacyParticipants.map((profile, index) => [
      profile.userId,
      onboardingSnapshots[index].exists,
    ])
  )
  const batch = firestore.batch()

  const chunkParticipants = participants.map((profile) => {
    const allocation = calculateRaffleAllocation({
      xp: profile.xp,
      convertedXp: profile.convertedXp,
      ticketBalance: profile.ticketBalance,
      hasOnboardingGrant:
        profile.onboardingTicketGranted ??
        legacyGrantByParticipant.get(profile.userId) ??
        false,
    })
    const balanceTickets =
      profile.ticketBalance +
      allocation.onboardingTickets +
      allocation.autoConvertedTickets
    return {
      participantId: profile.userId,
      participantName: profile.displayName,
      ticketWeight: allocation.ticketWeight,
      balanceTickets,
      autoConvertedTickets: allocation.autoConvertedTickets,
    }
  })

  if (chunkParticipants.length > 0) {
    const chunkId = deterministicId([
      simulation.id,
      nextSnapshots.at(-1)?.id ?? randomUUID(),
      "raffle_entry_chunk",
    ])

    batch.create(runRef.collection("entryChunks").doc(chunkId), {
      eventId: validatedEventId,
      snapshotAt: Timestamp.fromDate(simulation.snapshotAt),
      participants: chunkParticipants,
    })
  }

  const reachedEnd = profileSnapshots.size <= validatedBatchSize
  const processedParticipants =
    simulation.processedParticipants + participants.length

  batch.update(runRef, {
    cursor: nextSnapshots.at(-1)?.id ?? simulation.cursor,
    processedParticipants,
    status: reachedEnd ? "ready" : "preparing",
  })
  await batch.commit()

  return {
    status: reachedEnd ? ("ready" as const) : ("preparing" as const),
    processedParticipants,
  }
}

export async function findSimulationRaffles(runId: string) {
  const validatedRunId = raffleSimulationFieldsSchema.shape.id.parse(runId)
  const snapshots = await simulationRef(validatedRunId)
    .collection("raffles")
    .get()

  return snapshots.docs
    .map((snapshot) => parseRaffle(snapshot.id, snapshot.data()))
    .sort((first, second) => first.order - second.order)
}

async function findSimulationEntries(runId: string) {
  const runRef = simulationRef(runId)
  const [chunkSnapshots, winnerSnapshots] = await Promise.all([
    runRef.collection("entryChunks").get(),
    runRef.collection("winners").get(),
  ])
  const winnerIds = new Set(winnerSnapshots.docs.map((snapshot) => snapshot.id))

  return chunkSnapshots.docs
    .flatMap(
      (snapshot) => parseEntryChunk(snapshot.id, snapshot.data()).participants
    )
    .filter(
      (entry) => !winnerIds.has(entry.participantId) && entry.ticketWeight > 0
    )
}

async function findSimulationAttempts(runId: string, raffleId: string) {
  const snapshots = await simulationRef(runId).collection("attempts").get()

  return snapshots.docs
    .map((snapshot) => parseAttempt(snapshot.id, snapshot.data()))
    .filter((attempt) => attempt.raffleId === raffleId)
}

export async function drawSimulationRaffle(
  eventId: string,
  runId: string,
  raffleId: string,
  operatorId: string
) {
  const validatedEventId = profileSchema.shape.eventId.parse(eventId)
  const validatedRunId = raffleSimulationFieldsSchema.shape.id.parse(runId)
  const validatedRaffleId = raffleFieldsSchema.shape.id.parse(raffleId)
  const validatedOperatorId = profileSchema.shape.userId.parse(operatorId)
  const runRef = simulationRef(validatedRunId)
  const raffleRef = runRef.collection("raffles").doc(validatedRaffleId)

  for (let retry = 0; retry < 5; retry += 1) {
    const [entries, attempts] = await Promise.all([
      findSimulationEntries(validatedRunId),
      findSimulationAttempts(validatedRunId, validatedRaffleId),
    ])
    const attemptedIds = new Set(
      attempts.map((attempt) => attempt.participantId)
    )
    const candidates = entries.filter(
      (entry) => !attemptedIds.has(entry.participantId)
    )
    const totalWeight = candidates.reduce(
      (total, entry) => total + entry.ticketWeight,
      0
    )

    if (totalWeight <= 0) {
      return { status: "no-eligible-participants" as const }
    }

    const randomOffset = randomInt(totalWeight)
    const candidate = selectWeightedCandidate(candidates, randomOffset)

    if (!candidate) {
      throw new Error("Simulation did not select a candidate")
    }

    const attemptId = deterministicId([
      validatedRunId,
      validatedRaffleId,
      randomUUID(),
    ])
    const attemptRef = runRef.collection("attempts").doc(attemptId)
    const result = await firestore.runTransaction(async (transaction) => {
      const [runSnapshot, raffleSnapshot] = await Promise.all([
        transaction.get(runRef),
        transaction.get(raffleRef),
      ])

      if (!runSnapshot.exists || !raffleSnapshot.exists) {
        return "unavailable" as const
      }

      const run = parseSimulation(runSnapshot.id, runSnapshot.data())
      const raffle = parseRaffle(raffleSnapshot.id, raffleSnapshot.data())

      if (
        run.eventId !== validatedEventId ||
        run.status !== "ready" ||
        raffle.status === "drawn"
      ) {
        return "unavailable" as const
      }

      if (raffle.status === "awaiting_confirmation") {
        return "awaiting-confirmation" as const
      }

      if (attemptedIds.has(candidate.participantId)) {
        return "retry" as const
      }

      const now = Timestamp.now()

      transaction.update(raffleRef, {
        status: "awaiting_confirmation",
        currentAttemptId: attemptId,
        currentCandidateId: candidate.participantId,
        currentCandidateName: candidate.participantName,
        eligibleParticipantCount: candidates.length,
        eligibleTicketTotal: totalWeight,
        randomOffset,
        updatedAt: now,
      })
      transaction.create(attemptRef, {
        eventId: validatedEventId,
        raffleId: validatedRaffleId,
        participantId: candidate.participantId,
        participantName: candidate.participantName,
        ticketWeight: candidate.ticketWeight,
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
      return { status: result, candidateName: candidate.participantName }
    }
  }

  throw new Error("Simulation draw conflicted too many times")
}

export async function confirmSimulationWinner(
  eventId: string,
  runId: string,
  raffleId: string,
  attemptId: string,
  operatorId: string
) {
  const validatedEventId = profileSchema.shape.eventId.parse(eventId)
  const validatedRunId = raffleSimulationFieldsSchema.shape.id.parse(runId)
  const validatedRaffleId = raffleFieldsSchema.shape.id.parse(raffleId)
  const validatedAttemptId = raffleAttemptFieldsSchema.shape.id.parse(attemptId)
  const validatedOperatorId = profileSchema.shape.userId.parse(operatorId)
  const runRef = simulationRef(validatedRunId)
  const raffleRef = runRef.collection("raffles").doc(validatedRaffleId)

  return firestore.runTransaction(async (transaction) => {
    const [runSnapshot, raffleSnapshot] = await Promise.all([
      transaction.get(runRef),
      transaction.get(raffleRef),
    ])

    if (!runSnapshot.exists || !raffleSnapshot.exists) {
      return "unavailable" as const
    }

    const run = parseSimulation(runSnapshot.id, runSnapshot.data())
    const raffle = parseRaffle(raffleSnapshot.id, raffleSnapshot.data())

    if (
      run.eventId !== validatedEventId ||
      run.status !== "ready" ||
      raffle.status !== "awaiting_confirmation" ||
      raffle.currentAttemptId !== validatedAttemptId ||
      !raffle.currentCandidateId
    ) {
      return "unavailable" as const
    }

    const attemptRef = runRef.collection("attempts").doc(validatedAttemptId)
    const winnerRef = runRef
      .collection("winners")
      .doc(raffle.currentCandidateId)
    const [attemptSnapshot, winnerSnapshot] = await Promise.all([
      transaction.get(attemptRef),
      transaction.get(winnerRef),
    ])

    if (!attemptSnapshot.exists || winnerSnapshot.exists) {
      return "unavailable" as const
    }

    const attempt = parseAttempt(attemptSnapshot.id, attemptSnapshot.data())

    if (
      attempt.status !== "pending" ||
      attempt.participantId !== raffle.currentCandidateId
    ) {
      return "unavailable" as const
    }

    const now = Timestamp.now()

    transaction.update(raffleRef, {
      status: "drawn",
      winnerId: attempt.participantId,
      winnerName: attempt.participantName,
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
      participantId: attempt.participantId,
      participantName: attempt.participantName,
      raffleId: validatedRaffleId,
      consumeTickets: CONSUME_RAFFLE_WINNER_TICKETS,
      confirmedAt: now,
      confirmedBy: validatedOperatorId,
    })

    return "confirmed" as const
  })
}

export async function rerollSimulationRaffle(
  eventId: string,
  runId: string,
  raffleId: string,
  attemptId: string,
  operatorId: string
) {
  const validatedEventId = profileSchema.shape.eventId.parse(eventId)
  const validatedRunId = raffleSimulationFieldsSchema.shape.id.parse(runId)
  const validatedRaffleId = raffleFieldsSchema.shape.id.parse(raffleId)
  const validatedAttemptId = raffleAttemptFieldsSchema.shape.id.parse(attemptId)
  const validatedOperatorId = profileSchema.shape.userId.parse(operatorId)
  const runRef = simulationRef(validatedRunId)
  const raffleRef = runRef.collection("raffles").doc(validatedRaffleId)
  const released = await firestore.runTransaction(async (transaction) => {
    const [runSnapshot, raffleSnapshot] = await Promise.all([
      transaction.get(runRef),
      transaction.get(raffleRef),
    ])

    if (!runSnapshot.exists || !raffleSnapshot.exists) {
      return false
    }

    const run = parseSimulation(runSnapshot.id, runSnapshot.data())
    const raffle = parseRaffle(raffleSnapshot.id, raffleSnapshot.data())

    if (
      run.eventId !== validatedEventId ||
      run.status !== "ready" ||
      raffle.status !== "awaiting_confirmation" ||
      raffle.currentAttemptId !== validatedAttemptId
    ) {
      return false
    }

    const attemptRef = runRef.collection("attempts").doc(validatedAttemptId)
    const attemptSnapshot = await transaction.get(attemptRef)

    if (!attemptSnapshot.exists) {
      return false
    }

    const attempt = parseAttempt(attemptSnapshot.id, attemptSnapshot.data())

    if (attempt.status !== "pending") {
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

  return released
    ? drawSimulationRaffle(
        validatedEventId,
        validatedRunId,
        validatedRaffleId,
        validatedOperatorId
      )
    : { status: "unavailable" as const }
}

export async function setSimulationRedemptionsEnabled(
  eventId: string,
  runId: string,
  operatorId: string,
  enabled: boolean
) {
  const validatedEventId = profileSchema.shape.eventId.parse(eventId)
  const validatedRunId = raffleSimulationFieldsSchema.shape.id.parse(runId)
  profileSchema.shape.userId.parse(operatorId)
  const validatedEnabled = z.boolean().parse(enabled)
  const raffles = await findSimulationRaffles(validatedRunId)

  if (
    validatedEnabled &&
    (raffles.length === 0 ||
      raffles.some((raffle) => raffle.status !== "drawn"))
  ) {
    return "raffles-pending" as const
  }

  const runRef = simulationRef(validatedRunId)

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(runRef)

    if (!snapshot.exists) {
      return "unavailable" as const
    }

    const run = parseSimulation(snapshot.id, snapshot.data())

    if (run.eventId !== validatedEventId || run.status !== "ready") {
      return "unavailable" as const
    }

    transaction.update(runRef, {
      rewardRedemptionEnabled: validatedEnabled,
    })

    return "updated" as const
  })
}

export async function archiveRaffleSimulation(
  eventId: string,
  runId: string,
  operatorId: string
) {
  const validatedEventId = profileSchema.shape.eventId.parse(eventId)
  const validatedRunId = raffleSimulationFieldsSchema.shape.id.parse(runId)
  const validatedOperatorId = profileSchema.shape.userId.parse(operatorId)
  const runRef = simulationRef(validatedRunId)
  const operationsRef = firestore
    .collection(OPERATIONS_COLLECTION)
    .doc(validatedEventId)

  return firestore.runTransaction(async (transaction) => {
    const [runSnapshot, operationsSnapshot] = await Promise.all([
      transaction.get(runRef),
      transaction.get(operationsRef),
    ])

    if (!runSnapshot.exists || !operationsSnapshot.exists) {
      return false
    }

    const run = parseSimulation(runSnapshot.id, runSnapshot.data())

    if (
      run.eventId !== validatedEventId ||
      operationsSnapshot.data()?.raffleSimulationRunId !== validatedRunId
    ) {
      return false
    }

    const now = Timestamp.now()

    transaction.update(runRef, {
      status: "archived",
      archivedAt: now,
      archivedBy: validatedOperatorId,
    })
    transaction.update(operationsRef, {
      raffleSimulationRunId: null,
      updatedAt: now,
      updatedBy: validatedOperatorId,
    })

    return true
  })
}
