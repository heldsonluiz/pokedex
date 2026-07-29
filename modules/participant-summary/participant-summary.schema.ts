import * as z from "zod"

export const participantSummaryFieldsSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  connectionsCount: z.number().int().nonnegative().default(0),
  companiesVisitedCount: z.number().int().nonnegative().default(0),
  tagsDiscoveredCount: z.number().int().nonnegative().default(0),
  missionsCompletedCount: z.number().int().nonnegative().default(0),
  initializedAt: z.date(),
  updatedAt: z.date(),
})

export type ParticipantSummary = z.infer<typeof participantSummaryFieldsSchema>

export type ParticipantSummaryCounter =
  | "connectionsCount"
  | "companiesVisitedCount"
  | "tagsDiscoveredCount"
  | "missionsCompletedCount"
