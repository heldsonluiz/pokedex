import * as z from "zod"

const companyIdSchema = z.string().trim().min(1).max(128)

export const companyFieldsSchema = z
  .object({
    id: companyIdSchema,
    eventId: z.string().trim().min(1).max(128),
    qrId: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1_000).nullable(),
    logoUrl: z.url(),
    stampImageUrl: z.url().nullable(),
    active: z.boolean(),
    xpAwarded: z.number().int().positive().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export const visitCompanyInputSchema = z
  .object({
    eventId: z.string().trim().min(1).max(128),
    qrId: z.string().uuid(),
  })
  .strict()

export type Company = z.infer<typeof companyFieldsSchema>
export type VisitCompanyInput = z.infer<typeof visitCompanyInputSchema>
