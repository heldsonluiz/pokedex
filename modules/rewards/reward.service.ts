import "server-only"

import type { Session } from "next-auth"

import { findEventOperations } from "@/modules/tickets/ticket.repository"
import {
  findParticipantServiceContext,
  getParticipantServiceForSession,
} from "@/modules/tickets/ticket.service"

import {
  findActiveRewards,
  findParticipantRewardRedemptions,
  invalidateRewardsCache,
  redeemReward,
} from "./reward.repository"
import { redeemRewardInputSchema } from "./reward.schema"
import { getRewardAvailability } from "./reward-policy"

export async function getRewardsForParticipantService(
  session: Session,
  participantQrId: string,
  participantToken: string
) {
  const [ticketService, context] = await Promise.all([
    getParticipantServiceForSession(session, participantQrId, participantToken),
    findParticipantServiceContext(session, participantQrId, participantToken),
  ])

  if (!ticketService || !context) {
    return null
  }

  const [rewards, redemptions, operations] = await Promise.all([
    findActiveRewards(context.participant.eventId),
    findParticipantRewardRedemptions(
      context.participant.eventId,
      context.participant.userId
    ),
    findEventOperations(context.participant.eventId),
  ])
  const redemptionByRewardId = new Map(
    redemptions.map((redemption) => [redemption.rewardId, redemption])
  )

  return {
    ...ticketService,
    redemptionEnabled: operations.rewardRedemptionEnabled,
    rewards: rewards.map((reward) => {
      const redemption = redemptionByRewardId.get(reward.id)
      const availability = getRewardAvailability({
        redemptionEnabled: operations.rewardRedemptionEnabled,
        ticketBalance: ticketService.ticketBalance,
        ticketCost: reward.ticketCost,
        stock: reward.stock,
        redeemedQuantity: redemption?.quantity ?? 0,
        redemptionLimit: reward.redemptionLimit,
      })

      return {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl,
        ticketCost: reward.ticketCost,
        stock: reward.stock,
        redeemedQuantity: redemption?.quantity ?? 0,
        redemptionLimit: reward.redemptionLimit,
        ...availability,
      }
    }),
  }
}

export async function redeemRewardForSession(session: Session, input: unknown) {
  const validatedInput = redeemRewardInputSchema.parse(input)
  const context = await findParticipantServiceContext(
    session,
    validatedInput.participantQrId,
    validatedInput.participantToken
  )

  if (!context) {
    return { success: false as const, code: "FORBIDDEN" as const }
  }

  const result = await redeemReward({
    eventId: context.participant.eventId,
    participantId: context.participant.userId,
    operatorId: context.operator.userId,
    rewardId: validatedInput.rewardId,
    idempotencyKey: validatedInput.idempotencyKey,
  })

  if (result.status === "redeemed") {
    invalidateRewardsCache()
  }

  return result.status === "redeemed" || result.status === "already-redeemed"
    ? {
        success: true as const,
        code: result.status,
        rewardName: result.reward.name,
      }
    : { success: false as const, code: result.status }
}
