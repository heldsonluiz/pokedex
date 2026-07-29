import "server-only"

import { createHash } from "node:crypto"

import { Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"
import { accessRolesSchema } from "@/modules/profile/profile.schema"
import { ticketTransactionFieldsSchema } from "@/modules/tickets/ticket.schema"

import {
  type Reward,
  rewardFieldsSchema,
  type RewardRedemption,
  rewardRedemptionFieldsSchema,
} from "./reward.schema"

const EVENT_OPERATIONS_COLLECTION = "eventOperations"
const PROFILES_COLLECTION = "profiles"
const REDEMPTIONS_COLLECTION = "rewardRedemptions"
const REWARDS_COLLECTION = "rewards"
const TICKET_TRANSACTIONS_COLLECTION = "ticketTransactions"

const rewardDocumentSchema = rewardFieldsSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    createdAt: z.instanceof(Timestamp),
    updatedAt: z.instanceof(Timestamp),
  })

const redemptionDocumentSchema = rewardRedemptionFieldsSchema
  .omit({ id: true, firstRedeemedAt: true, lastRedeemedAt: true })
  .extend({
    firstRedeemedAt: z.instanceof(Timestamp),
    lastRedeemedAt: z.instanceof(Timestamp),
  })

const ticketProfileSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  onboardingCompleted: z.boolean(),
  accessRoles: accessRolesSchema.default(["participant"]),
  ticketBalance: z.number().int().nonnegative().default(0),
})

const eventOperationsSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  rewardRedemptionEnabled: z.boolean().default(true),
})

function getId(parts: readonly string[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex")
}

function parseReward(id: string, value: unknown): Reward {
  const document = rewardDocumentSchema.parse(value)

  return rewardFieldsSchema.parse({
    id,
    ...document,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate(),
  })
}

function parseRedemption(id: string, value: unknown): RewardRedemption {
  const document = redemptionDocumentSchema.parse(value)

  return rewardRedemptionFieldsSchema.parse({
    id,
    ...document,
    firstRedeemedAt: document.firstRedeemedAt.toDate(),
    lastRedeemedAt: document.lastRedeemedAt.toDate(),
  })
}

export async function findActiveRewards(eventId: string): Promise<Reward[]> {
  const validatedEventId = rewardFieldsSchema.shape.eventId.parse(eventId)
  const snapshots = await firestore
    .collection(REWARDS_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .get()

  return snapshots.docs
    .map((snapshot) => parseReward(snapshot.id, snapshot.data()))
    .filter((reward) => reward.eventId === validatedEventId && reward.active)
    .sort(
      (first, second) =>
        first.order - second.order ||
        first.name.localeCompare(second.name, "pt-BR")
    )
}

export async function findParticipantRewardRedemptions(
  eventId: string,
  participantId: string
) {
  const validatedEventId = rewardFieldsSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    rewardRedemptionFieldsSchema.shape.participantId.parse(participantId)
  const snapshots = await firestore
    .collection(REDEMPTIONS_COLLECTION)
    .where("participantId", "==", validatedParticipantId)
    .get()

  return snapshots.docs
    .map((snapshot) => parseRedemption(snapshot.id, snapshot.data()))
    .filter(
      (redemption) =>
        redemption.eventId === validatedEventId &&
        redemption.participantId === validatedParticipantId
    )
}

export type RedeemRewardResult =
  | Readonly<{
      status: "redeemed" | "already-redeemed"
      reward: Reward
      ticketBalance: number
    }>
  | Readonly<{
      status:
        | "insufficient-tickets"
        | "limit-reached"
        | "not-found"
        | "out-of-stock"
        | "profile-unavailable"
        | "redemption-disabled"
    }>

export async function redeemReward({
  eventId,
  participantId,
  operatorId,
  rewardId,
  idempotencyKey,
}: {
  eventId: string
  participantId: string
  operatorId: string
  rewardId: string
  idempotencyKey: string
}): Promise<RedeemRewardResult> {
  const validatedEventId = rewardFieldsSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    rewardRedemptionFieldsSchema.shape.participantId.parse(participantId)
  const validatedOperatorId =
    rewardRedemptionFieldsSchema.shape.lastOperatorId.parse(operatorId)
  const validatedRewardId = rewardFieldsSchema.shape.id.parse(rewardId)
  const validatedIdempotencyKey = z.uuid().parse(idempotencyKey)
  const profileRef = firestore
    .collection(PROFILES_COLLECTION)
    .doc(validatedParticipantId)
  const rewardRef = firestore
    .collection(REWARDS_COLLECTION)
    .doc(validatedRewardId)
  const operationsRef = firestore
    .collection(EVENT_OPERATIONS_COLLECTION)
    .doc(validatedEventId)
  const redemptionId = getId([
    validatedEventId,
    validatedParticipantId,
    validatedRewardId,
  ])
  const redemptionRef = firestore
    .collection(REDEMPTIONS_COLLECTION)
    .doc(redemptionId)
  const transactionId = getId([
    validatedEventId,
    validatedParticipantId,
    "reward_redemption",
    validatedIdempotencyKey,
  ])
  const ticketTransactionRef = firestore
    .collection(TICKET_TRANSACTIONS_COLLECTION)
    .doc(transactionId)

  return firestore.runTransaction(async (transaction) => {
    const [
      profileSnapshot,
      rewardSnapshot,
      operationsSnapshot,
      redemptionSnapshot,
      ticketTransactionSnapshot,
    ] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(rewardRef),
      transaction.get(operationsRef),
      transaction.get(redemptionRef),
      transaction.get(ticketTransactionRef),
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

    if (!rewardSnapshot.exists) {
      return { status: "not-found" }
    }

    const reward = parseReward(rewardSnapshot.id, rewardSnapshot.data())

    if (reward.eventId !== validatedEventId || !reward.active) {
      return { status: "not-found" }
    }

    if (ticketTransactionSnapshot.exists) {
      const storedTransaction = ticketTransactionFieldsSchema
        .omit({ createdAt: true })
        .extend({ createdAt: z.instanceof(Timestamp) })
        .parse({
          id: ticketTransactionSnapshot.id,
          ...ticketTransactionSnapshot.data(),
        })

      if (
        storedTransaction.participantId !== validatedParticipantId ||
        storedTransaction.operatorId !== validatedOperatorId ||
        storedTransaction.referenceType !== "reward" ||
        storedTransaction.referenceId !== validatedRewardId
      ) {
        throw new Error("Stored reward redemption identity is invalid")
      }

      return {
        status: "already-redeemed",
        reward,
        ticketBalance: profile.ticketBalance,
      }
    }

    const operations = operationsSnapshot.exists
      ? eventOperationsSchema.parse(operationsSnapshot.data())
      : { eventId: validatedEventId, rewardRedemptionEnabled: true }

    if (
      operations.eventId !== validatedEventId ||
      !operations.rewardRedemptionEnabled
    ) {
      return { status: "redemption-disabled" }
    }

    const previousRedemption = redemptionSnapshot.exists
      ? parseRedemption(redemptionSnapshot.id, redemptionSnapshot.data())
      : null

    if (
      reward.redemptionLimit !== null &&
      (previousRedemption?.quantity ?? 0) >= reward.redemptionLimit
    ) {
      return { status: "limit-reached" }
    }

    if (reward.stock < 1) {
      return { status: "out-of-stock" }
    }

    if (profile.ticketBalance < reward.ticketCost) {
      return { status: "insufficient-tickets" }
    }

    const now = Timestamp.now()
    const nextBalance = profile.ticketBalance - reward.ticketCost

    transaction.update(profileRef, {
      ticketBalance: nextBalance,
      updatedAt: now,
    })
    transaction.update(rewardRef, {
      stock: reward.stock - 1,
      updatedAt: now,
    })

    if (previousRedemption) {
      transaction.update(redemptionRef, {
        quantity: previousRedemption.quantity + 1,
        ticketsSpent: previousRedemption.ticketsSpent + reward.ticketCost,
        lastRedeemedAt: now,
        lastOperatorId: validatedOperatorId,
      })
    } else {
      transaction.create(redemptionRef, {
        eventId: validatedEventId,
        participantId: validatedParticipantId,
        rewardId: validatedRewardId,
        quantity: 1,
        ticketsSpent: reward.ticketCost,
        firstRedeemedAt: now,
        lastRedeemedAt: now,
        lastOperatorId: validatedOperatorId,
      })
    }

    transaction.create(ticketTransactionRef, {
      eventId: validatedEventId,
      participantId: validatedParticipantId,
      type: "reward_redemption",
      ticketDelta: -reward.ticketCost,
      convertedXp: 0,
      operatorId: validatedOperatorId,
      referenceType: "reward",
      referenceId: validatedRewardId,
      createdAt: now,
    })

    return { status: "redeemed", reward, ticketBalance: nextBalance }
  })
}
