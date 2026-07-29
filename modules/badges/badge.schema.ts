import * as z from "zod"

export const badgeActivityTypeSchema = z.enum(["company", "tag", "mission"])

const activityCriterionSchema = z.object({
  type: z.literal("activity"),
  activityType: badgeActivityTypeSchema,
  activityId: z.string().trim().min(1).max(128),
})

const activityCountCriterionSchema = z.object({
  type: z.literal("activityCount"),
  activityType: badgeActivityTypeSchema,
  minimum: z.number().int().positive().max(1_000),
})

export type BadgeCriterion =
  | z.infer<typeof activityCriterionSchema>
  | z.infer<typeof activityCountCriterionSchema>
  | Readonly<{ type: "allOf" | "anyOf"; criteria: BadgeCriterion[] }>

export const badgeCriterionSchema: z.ZodType<BadgeCriterion> = z.lazy(() =>
  z.discriminatedUnion("type", [
    activityCriterionSchema,
    activityCountCriterionSchema,
    z.object({
      type: z.literal("allOf"),
      criteria: z.array(badgeCriterionSchema).min(2).max(20),
    }),
    z.object({
      type: z.literal("anyOf"),
      criteria: z.array(badgeCriterionSchema).min(2).max(20),
    }),
  ])
)

export const badgeFieldsSchema = z.object({
  id: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(240),
  imageUrl: z.url(),
  visibility: z.enum(["public", "secret"]),
  criterion: badgeCriterionSchema,
  active: z.boolean(),
  order: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const participantBadgeFieldsSchema = z.object({
  id: z.string().trim().length(64),
  eventId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  badgeId: z.string().trim().min(1).max(128),
  awardedAt: z.date(),
})

export type Badge = z.infer<typeof badgeFieldsSchema>
export type BadgeActivityType = z.infer<typeof badgeActivityTypeSchema>
export type ParticipantBadge = z.infer<typeof participantBadgeFieldsSchema>
