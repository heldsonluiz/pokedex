import * as z from "zod"

export const companyVisitFieldsSchema = z
  .object({
    id: z.string().regex(/^[a-f0-9]{64}$/),
    eventId: z.string().trim().min(1).max(128),
    participantId: z.string().trim().min(1).max(128),
    activityType: z.literal("company"),
    activityId: z.string().trim().min(1).max(128),
    qrId: z.string().uuid(),
    xpAwarded: z.number().int().positive(),
    completedAt: z.date(),
  })
  .strict()

export type CompanyVisit = z.infer<typeof companyVisitFieldsSchema>
