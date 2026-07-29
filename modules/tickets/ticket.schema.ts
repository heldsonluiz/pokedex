import * as z from "zod"

export const ticketTransactionTypeSchema = z.enum([
  "onboarding_grant",
  "xp_conversion",
  "reward_redemption",
  "adjustment",
])

export const ticketTransactionFieldsSchema = z.object({
  id: z.string().trim().length(64),
  eventId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  type: ticketTransactionTypeSchema,
  ticketDelta: z.number().int(),
  convertedXp: z.number().int().nonnegative(),
  operatorId: z.string().trim().min(1).max(128),
  referenceType: z.string().trim().min(1).max(64),
  referenceId: z.string().trim().min(1).max(128),
  createdAt: z.date(),
})

export const convertXpInputSchema = z
  .object({
    ticketAmount: z.coerce
      .number()
      .int("Informe uma quantidade inteira")
      .positive("Converta pelo menos um ticket")
      .max(100, "Converta no máximo 100 tickets por operação"),
    idempotencyKey: z.uuid(),
  })
  .strict()

export const assistedXpConversionInputSchema = convertXpInputSchema
  .extend({
    participantQrId: z.uuid(),
    participantToken: z.string().trim().min(1).max(2_048),
  })
  .strict()

export type TicketTransaction = z.infer<typeof ticketTransactionFieldsSchema>
export type ConvertXpInput = z.infer<typeof convertXpInputSchema>
