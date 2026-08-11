import "server-only"

import { createHash } from "node:crypto"

import { Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import {
  ONBOARDING_TICKET_AMOUNT,
  TICKET_EXCHANGE_RATE_XP,
} from "@/config/tickets"
import { firestore } from "@/lib/firebase/admin"
import { getFirestoreCollectionName } from "@/lib/firebase/firestore-collection"
import { accessRolesSchema } from "@/modules/profile/profile.schema"

import {
  type ConvertXpInput,
  type TicketTransaction,
  ticketTransactionFieldsSchema,
} from "./ticket.schema"

const EVENT_OPERATIONS_COLLECTION =
  getFirestoreCollectionName("eventOperations")
const PROFILES_COLLECTION = getFirestoreCollectionName("profiles")
const TRANSACTIONS_COLLECTION = getFirestoreCollectionName("ticketTransactions")

const ticketProfileSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  onboardingCompleted: z.boolean(),
  accessRoles: accessRolesSchema.default(["participant"]),
  xp: z.number().int().nonnegative().default(0),
  ticketBalance: z.number().int().nonnegative().default(0),
  convertedXp: z.number().int().nonnegative().default(0),
  onboardingTicketGranted: z.boolean().default(false),
})

const transactionDocumentSchema = ticketTransactionFieldsSchema
  .omit({ id: true, createdAt: true })
  .extend({ createdAt: z.instanceof(Timestamp) })

const eventOperationsSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  ticketConversionEnabled: z.boolean().default(true),
  rewardRedemptionEnabled: z.boolean().default(true),
  raffleClosureStatus: z.enum(["open", "processing", "closed"]).default("open"),
  raffleSimulationRunId: z.string().uuid().nullable().default(null),
})

function getTransactionId(parts: readonly string[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex")
}

function parseTransaction(id: string, value: unknown): TicketTransaction {
  const document = transactionDocumentSchema.parse(value)

  return ticketTransactionFieldsSchema.parse({
    id,
    ...document,
    createdAt: document.createdAt.toDate(),
  })
}

export async function ensureOnboardingTicket(
  eventId: string,
  participantId: string
): Promise<"granted" | "already-granted" | "profile-unavailable"> {
  const validatedEventId = ticketProfileSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    ticketProfileSchema.shape.userId.parse(participantId)
  const profileRef = firestore
    .collection(PROFILES_COLLECTION)
    .doc(validatedParticipantId)
  const transactionId = getTransactionId([
    validatedEventId,
    validatedParticipantId,
    "onboarding_grant",
  ])
  const transactionRef = firestore
    .collection(TRANSACTIONS_COLLECTION)
    .doc(transactionId)

  return firestore.runTransaction(async (transaction) => {
    const profileSnapshot = await transaction.get(profileRef)

    if (!profileSnapshot.exists) {
      return "profile-unavailable"
    }

    const profile = ticketProfileSchema.parse(profileSnapshot.data())

    if (
      profile.userId !== validatedParticipantId ||
      profile.eventId !== validatedEventId ||
      !profile.onboardingCompleted ||
      !profile.accessRoles.includes("participant")
    ) {
      return "profile-unavailable"
    }

    if (profile.onboardingTicketGranted) {
      return "already-granted"
    }

    const ticketSnapshot = await transaction.get(transactionRef)

    if (ticketSnapshot.exists) {
      parseTransaction(ticketSnapshot.id, ticketSnapshot.data())
      transaction.update(profileRef, {
        onboardingTicketGranted: true,
        updatedAt: Timestamp.now(),
      })

      return "already-granted"
    }

    const now = Timestamp.now()

    transaction.create(transactionRef, {
      eventId: validatedEventId,
      participantId: validatedParticipantId,
      type: "onboarding_grant",
      ticketDelta: ONBOARDING_TICKET_AMOUNT,
      convertedXp: 0,
      operatorId: validatedParticipantId,
      referenceType: "onboarding",
      referenceId: validatedParticipantId,
      createdAt: now,
    })
    transaction.update(profileRef, {
      ticketBalance: profile.ticketBalance + ONBOARDING_TICKET_AMOUNT,
      onboardingTicketGranted: true,
      updatedAt: now,
    })

    return "granted"
  })
}

export type ConvertXpResult =
  | Readonly<{
      status: "converted" | "already-converted"
      transaction: TicketTransaction
      ticketBalance: number
      convertedXp: number
    }>
  | Readonly<{
      status: "conversion-disabled" | "insufficient-xp" | "profile-unavailable"
    }>

export async function convertXpToTickets({
  eventId,
  participantId,
  operatorId,
  input,
}: {
  eventId: string
  participantId: string
  operatorId: string
  input: ConvertXpInput
}): Promise<ConvertXpResult> {
  const validatedEventId = ticketProfileSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    ticketProfileSchema.shape.userId.parse(participantId)
  const validatedOperatorId = ticketProfileSchema.shape.userId.parse(operatorId)
  const profileRef = firestore
    .collection(PROFILES_COLLECTION)
    .doc(validatedParticipantId)
  const operationsRef = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)
  const transactionId = getTransactionId([
    validatedEventId,
    validatedParticipantId,
    "xp_conversion",
    input.idempotencyKey,
  ])
  const transactionRef = firestore
    .collection(TRANSACTIONS_COLLECTION)
    .doc(transactionId)

  return firestore.runTransaction(async (transaction) => {
    const [profileSnapshot, operationsSnapshot, ticketSnapshot] =
      await Promise.all([
        transaction.get(profileRef),
        transaction.get(operationsRef),
        transaction.get(transactionRef),
      ])

    if (!profileSnapshot.exists) {
      return { status: "profile-unavailable" }
    }

    const profile = ticketProfileSchema.parse(profileSnapshot.data())

    if (
      profile.userId !== validatedParticipantId ||
      profile.eventId !== validatedEventId ||
      !profile.onboardingCompleted ||
      !profile.accessRoles.includes("participant")
    ) {
      return { status: "profile-unavailable" }
    }

    if (ticketSnapshot.exists) {
      const storedTransaction = parseTransaction(
        ticketSnapshot.id,
        ticketSnapshot.data()
      )

      if (
        storedTransaction.participantId !== validatedParticipantId ||
        storedTransaction.eventId !== validatedEventId ||
        storedTransaction.operatorId !== validatedOperatorId ||
        storedTransaction.ticketDelta !== input.ticketAmount
      ) {
        throw new Error("Stored ticket conversion identity is invalid")
      }

      return {
        status: "already-converted",
        transaction: storedTransaction,
        ticketBalance: profile.ticketBalance,
        convertedXp: profile.convertedXp,
      }
    }

    const operations = operationsSnapshot.exists
      ? eventOperationsSchema.parse(operationsSnapshot.data())
      : {
          eventId: validatedEventId,
          ticketConversionEnabled: true,
          rewardRedemptionEnabled: true,
          raffleClosureStatus: "open" as const,
          raffleSimulationRunId: null,
        }

    if (
      operations.eventId !== validatedEventId ||
      !operations.ticketConversionEnabled ||
      operations.raffleClosureStatus !== "open"
    ) {
      return { status: "conversion-disabled" }
    }

    const xpToConvert = input.ticketAmount * TICKET_EXCHANGE_RATE_XP
    const availableXp = Math.max(0, profile.xp - profile.convertedXp)

    if (xpToConvert > availableXp) {
      return { status: "insufficient-xp" }
    }

    const now = Timestamp.now()
    const nextBalance = profile.ticketBalance + input.ticketAmount
    const nextConvertedXp = profile.convertedXp + xpToConvert

    transaction.create(transactionRef, {
      eventId: validatedEventId,
      participantId: validatedParticipantId,
      type: "xp_conversion",
      ticketDelta: input.ticketAmount,
      convertedXp: xpToConvert,
      operatorId: validatedOperatorId,
      referenceType: "xp_conversion",
      referenceId: input.idempotencyKey,
      createdAt: now,
    })
    transaction.update(profileRef, {
      ticketBalance: nextBalance,
      convertedXp: nextConvertedXp,
      updatedAt: now,
    })

    return {
      status: "converted",
      transaction: ticketTransactionFieldsSchema.parse({
        id: transactionId,
        eventId: validatedEventId,
        participantId: validatedParticipantId,
        type: "xp_conversion",
        ticketDelta: input.ticketAmount,
        convertedXp: xpToConvert,
        operatorId: validatedParticipantId,
        referenceType: "xp_conversion",
        referenceId: input.idempotencyKey,
        createdAt: now.toDate(),
      }),
      ticketBalance: nextBalance,
      convertedXp: nextConvertedXp,
    }
  })
}

export async function findTicketTransactions(
  eventId: string,
  participantId: string
): Promise<TicketTransaction[]> {
  const validatedEventId = ticketProfileSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    ticketProfileSchema.shape.userId.parse(participantId)
  const snapshots = await firestore
    .collection(TRANSACTIONS_COLLECTION)
    .where("participantId", "==", validatedParticipantId)
    .get()

  return snapshots.docs
    .map((snapshot) => parseTransaction(snapshot.id, snapshot.data()))
    .filter(
      (transaction) =>
        transaction.eventId === validatedEventId &&
        transaction.participantId === validatedParticipantId
    )
    .sort(
      (first, second) => second.createdAt.getTime() - first.createdAt.getTime()
    )
}

export async function isTicketConversionEnabled(eventId: string) {
  return (await findEventOperations(eventId)).ticketConversionEnabled
}

export async function findEventOperations(eventId: string) {
  const validatedEventId = ticketProfileSchema.shape.eventId.parse(eventId)
  const snapshot = await firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)
    .get()

  if (!snapshot.exists) {
    return {
      ticketConversionEnabled: true,
      rewardRedemptionEnabled: true,
      raffleClosureStatus: "open" as const,
      raffleSimulationRunId: null,
    }
  }

  const operations = eventOperationsSchema.parse(snapshot.data())

  if (operations.eventId !== validatedEventId) {
    throw new Error("Stored event operations identity is invalid")
  }

  return {
    ticketConversionEnabled: operations.ticketConversionEnabled,
    rewardRedemptionEnabled: operations.rewardRedemptionEnabled,
    raffleClosureStatus: operations.raffleClosureStatus,
    raffleSimulationRunId: operations.raffleSimulationRunId,
  }
}

export async function setRewardRedemptionEnabled(
  eventId: string,
  enabled: boolean,
  operatorId: string
) {
  const validatedEventId = ticketProfileSchema.shape.eventId.parse(eventId)
  const validatedOperatorId = ticketProfileSchema.shape.userId.parse(operatorId)
  const validatedEnabled = z.boolean().parse(enabled)

  const reference = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference)
    const operations = snapshot.exists
      ? eventOperationsSchema.parse(snapshot.data())
      : null

    if (
      operations &&
      (operations.raffleClosureStatus !== "open" ||
        operations.raffleSimulationRunId)
    ) {
      return false
    }

    transaction.set(
      reference,
      {
        eventId: validatedEventId,
        rewardRedemptionEnabled: validatedEnabled,
        updatedAt: Timestamp.now(),
        updatedBy: validatedOperatorId,
      },
      { merge: true }
    )

    return true
  })
}

export async function setTicketConversionEnabled(
  eventId: string,
  enabled: boolean,
  operatorId: string
) {
  const validatedEventId = ticketProfileSchema.shape.eventId.parse(eventId)
  const validatedOperatorId = ticketProfileSchema.shape.userId.parse(operatorId)
  const validatedEnabled = z.boolean().parse(enabled)
  const reference = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference)
    const operations = snapshot.exists
      ? eventOperationsSchema.parse(snapshot.data())
      : null

    if (
      operations &&
      (operations.raffleClosureStatus !== "open" ||
        operations.raffleSimulationRunId)
    ) {
      return false
    }

    transaction.set(
      reference,
      {
        eventId: validatedEventId,
        ticketConversionEnabled: validatedEnabled,
        updatedAt: Timestamp.now(),
        updatedBy: validatedOperatorId,
      },
      { merge: true }
    )

    return true
  })
}
