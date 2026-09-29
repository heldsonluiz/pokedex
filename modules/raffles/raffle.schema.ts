import * as z from "zod"

import { RAFFLE_PREPARATION_BATCH_SIZE } from "@/config/raffles"

export const raffleProfileCursorSchema = z.object({
  xp: z.number().int().nonnegative(),
  xpReachedAtMs: z.number().int().nonnegative().nullable(),
  userId: z.string().trim().min(1).max(128),
})

export const storedRaffleProfileCursorSchema = z.union([
  raffleProfileCursorSchema,
  z.string().trim().min(1).max(128),
])

export const raffleEntryFieldsSchema = z.object({
  id: z.string().trim().length(64),
  eventId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  participantName: z.string().trim().min(1).max(120),
  ticketWeight: z.number().int().nonnegative(),
  balanceTickets: z.number().int().nonnegative(),
  autoConvertedTickets: z.number().int().nonnegative(),
  winnerExcluded: z.boolean(),
  winnerRaffleId: z.string().trim().min(1).max(128).nullable(),
  snapshotAt: z.date(),
})

export const raffleSnapshotParticipantSchema = z.object({
  participantId: z.string().trim().min(1).max(128),
  participantName: z.string().trim().min(1).max(120),
  ticketWeight: z.number().int().nonnegative(),
  balanceTickets: z.number().int().nonnegative(),
  autoConvertedTickets: z.number().int().nonnegative(),
})

export const raffleEntryChunkFieldsSchema = z.object({
  id: z.string().trim().length(64),
  eventId: z.string().trim().min(1).max(128),
  snapshotAt: z.date(),
  participants: z
    .array(raffleSnapshotParticipantSchema)
    .min(1)
    .max(RAFFLE_PREPARATION_BATCH_SIZE),
})

export const raffleFieldsSchema = z.object({
  id: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  sponsorId: z.string().trim().min(1).max(128).nullable().optional(),
  prizeName: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).nullable(),
  imageUrl: z.url().nullable(),
  order: z.number().int().nonnegative(),
  active: z.boolean(),
  status: z.enum(["pending", "awaiting_confirmation", "drawn"]),
  currentAttemptId: z.string().trim().length(64).nullable().default(null),
  currentCandidateId: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .nullable()
    .default(null),
  currentCandidateName: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .nullable()
    .default(null),
  winnerId: z.string().trim().min(1).max(128).nullable(),
  winnerName: z.string().trim().min(1).max(120).nullable(),
  eligibleParticipantCount: z.number().int().nonnegative().nullable(),
  eligibleTicketTotal: z.number().int().nonnegative().nullable(),
  randomOffset: z.number().int().nonnegative().nullable(),
  drawnAt: z.date().nullable(),
  drawnBy: z.string().trim().min(1).max(128).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const raffleAttemptFieldsSchema = z.object({
  id: z.string().trim().length(64),
  eventId: z.string().trim().min(1).max(128),
  raffleId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  participantName: z.string().trim().min(1).max(120),
  ticketWeight: z.number().int().positive(),
  eligibleParticipantCount: z.number().int().positive(),
  eligibleTicketTotal: z.number().int().positive(),
  randomOffset: z.number().int().nonnegative(),
  status: z.enum(["pending", "absent", "confirmed"]),
  selectedAt: z.date(),
  selectedBy: z.string().trim().min(1).max(128),
  resolvedAt: z.date().nullable(),
  resolvedBy: z.string().trim().min(1).max(128).nullable(),
})

export type RaffleEntry = z.infer<typeof raffleEntryFieldsSchema>
export type RaffleSnapshotParticipant = z.infer<
  typeof raffleSnapshotParticipantSchema
>
export type RaffleEntryChunk = z.infer<typeof raffleEntryChunkFieldsSchema>
export type Raffle = z.infer<typeof raffleFieldsSchema>
export type RaffleAttempt = z.infer<typeof raffleAttemptFieldsSchema>
export type RaffleProfileCursor = z.infer<
  typeof storedRaffleProfileCursorSchema
>
