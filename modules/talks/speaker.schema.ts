import * as z from "zod"

const optionalTextSchema = (maximum: number) =>
  z.string().trim().min(1).max(maximum).nullable()

export const speakerSocialMediaSchema = z
  .object({
    instagram: z.url().nullable(),
    linkedIn: z.url().nullable(),
  })
  .strict()

export const speakerFieldsSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    eventId: z.string().trim().min(1).max(128),
    name: z.string().trim().min(2).max(120),
    company: optionalTextSchema(120),
    title: optionalTextSchema(120),
    miniBio: optionalTextSchema(3_000),
    photoUrl: z.url().nullable(),
    socialMedia: speakerSocialMediaSchema,
    isVisible: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type Speaker = z.infer<typeof speakerFieldsSchema>
