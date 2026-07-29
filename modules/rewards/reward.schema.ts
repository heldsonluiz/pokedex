import * as z from "zod"

export const rewardFieldsSchema = z.object({
  id: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(240),
  imageUrl: z.url(),
  ticketCost: z.number().int().positive().max(1_000),
  stock: z.number().int().nonnegative(),
  redemptionLimit: z.number().int().positive().max(100).nullable(),
  active: z.boolean(),
  order: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const rewardRedemptionFieldsSchema = z.object({
  id: z.string().trim().length(64),
  eventId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  rewardId: z.string().trim().min(1).max(128),
  quantity: z.number().int().positive(),
  ticketsSpent: z.number().int().positive(),
  firstRedeemedAt: z.date(),
  lastRedeemedAt: z.date(),
  lastOperatorId: z.string().trim().min(1).max(128),
})

export const redeemRewardInputSchema = z
  .object({
    rewardId: rewardFieldsSchema.shape.id,
    participantQrId: z.uuid(),
    participantToken: z.string().trim().min(1).max(2_048),
    idempotencyKey: z.uuid(),
  })
  .strict()

export type Reward = z.infer<typeof rewardFieldsSchema>
export type RewardRedemption = z.infer<typeof rewardRedemptionFieldsSchema>
