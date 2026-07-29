import * as z from "zod"

export const raffleSimulationFieldsSchema = z.object({
  id: z.uuid(),
  eventId: z.string().trim().min(1).max(128),
  status: z.enum(["preparing", "ready", "archived"]),
  snapshotFormat: z.enum(["legacy", "chunked-v1"]).default("legacy"),
  cursor: z.string().trim().min(1).max(128).nullable(),
  processedParticipants: z.number().int().nonnegative(),
  rewardRedemptionEnabled: z.boolean(),
  snapshotAt: z.date(),
  createdAt: z.date(),
  createdBy: z.string().trim().min(1).max(128),
  archivedAt: z.date().nullable(),
  archivedBy: z.string().trim().min(1).max(128).nullable(),
})

export type RaffleSimulation = z.infer<typeof raffleSimulationFieldsSchema>
