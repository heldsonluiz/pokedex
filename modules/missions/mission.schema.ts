import * as z from "zod"

export const missionValidationTypeSchema = z.enum(["qr", "reviewer"])

export const missionPrerequisiteSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("company"),
      activityId: z.string().trim().min(1).max(128),
    })
    .strict(),
  z
    .object({
      type: z.literal("mission"),
      activityId: z.string().trim().min(1).max(128),
    })
    .strict(),
])

export const missionFieldsSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    eventId: z.string().trim().min(1).max(128),
    qrId: z.string().uuid().nullable(),
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(1).max(1_000),
    imageUrl: z.url().nullable(),
    validationType: missionValidationTypeSchema,
    prerequisites: z.array(missionPrerequisiteSchema).max(20).default([]),
    active: z.boolean(),
    order: z.number().int().nonnegative(),
    xpAwarded: z.number().int().positive().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .superRefine((mission, context) => {
    if (mission.validationType === "qr" && !mission.qrId) {
      context.addIssue({
        code: "custom",
        path: ["qrId"],
        message: "QR missions must have a public QR identifier",
      })
    }

    if (mission.validationType === "reviewer" && mission.qrId) {
      context.addIssue({
        code: "custom",
        path: ["qrId"],
        message: "Reviewer missions must not have a public QR identifier",
      })
    }
  })

export const completeQrMissionInputSchema = z
  .object({
    eventId: z.string().trim().min(1).max(128),
    qrId: z.string().uuid(),
  })
  .strict()

export const reviewMissionInputSchema = z
  .object({
    missionId: z.string().trim().min(1).max(128),
    eventId: z.string().trim().min(1).max(128),
    participantQrId: z.string().uuid(),
    token: z.string().trim().min(1).max(2_048),
  })
  .strict()

export type Mission = z.infer<typeof missionFieldsSchema>
export type MissionPrerequisite = z.infer<typeof missionPrerequisiteSchema>
