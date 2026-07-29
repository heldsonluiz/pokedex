import * as z from "zod"

export const missionCompletionFieldsSchema = z
  .object({
    id: z.string().length(64),
    eventId: z.string().trim().min(1).max(128),
    participantId: z.string().trim().min(1).max(128),
    activityType: z.literal("mission"),
    activityId: z.string().trim().min(1).max(128),
    qrId: z.string().uuid().nullable(),
    validationType: z.enum(["qr", "reviewer"]),
    validatedBy: z.string().trim().min(1).max(128).nullable(),
    validatedAt: z.date().nullable(),
    xpAwarded: z.number().int().positive(),
    completedAt: z.date(),
  })
  .strict()

export type MissionCompletion = z.infer<typeof missionCompletionFieldsSchema>
