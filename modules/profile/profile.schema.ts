import * as z from "zod"

export const profileIdentitySchema = z.object({
  userId: z.string().trim().min(1),
  eventId: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  email: z.string().trim().email(),
  avatarUrl: z.string().url().nullable(),
})

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => value || null)

const optionalBioSchema = z
  .string()
  .trim()
  .max(200, "A biografia deve ter no máximo 200 caracteres")
  .transform((value) => value || null)

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
const httpUrlSchema = z
  .url()
  .refine(isHttpUrl, "Informe um link HTTP ou HTTPS válido")

const optionalLinkSchema = z
  .string()
  .trim()
  .refine((value) => !value || isHttpUrl(value), {
    message: "Informe um link HTTP ou HTTPS válido",
  })
  .transform((value) => value || null)

const skillSchema = z
  .string()
  .trim()
  .min(1, "A habilidade não pode estar vazia")

export const profileUpdateSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(3, "O nome deve ter no mínimo 3 caracteres"),
    bio: optionalBioSchema,
    role: optionalTextSchema,
    company: optionalTextSchema,
    link: optionalLinkSchema,
    skills: z
      .array(skillSchema)
      .min(1, "Informe pelo menos uma habilidade")
      .max(5, "Informe no máximo 5 habilidades"),
  })
  .strict()

export const storedProfileFieldsSchema = z.object({
  bio: z.string().trim().max(200).nullable().default(null),
  role: z.string().trim().nullable().default(null),
  company: z.string().trim().nullable().default(null),
  link: httpUrlSchema.nullable().default(null),
  skills: z.array(skillSchema).max(5).default([]),
})

export type StoredProfileFields = z.infer<typeof storedProfileFieldsSchema>

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>

export type ProfileIdentity = z.infer<typeof profileIdentitySchema>
