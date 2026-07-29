import * as z from "zod"

import { isValidSkillSlug } from "./profile-skills"

export const ACCESS_ROLES = [
  "participant",
  "staff",
  "reviewer",
  "editor",
  "admin",
] as const

export const accessRoleSchema = z.enum(ACCESS_ROLES)

export const accessRolesSchema = z
  .array(accessRoleSchema)
  .min(1)
  .refine(
    (roles) => new Set(roles).size === roles.length,
    "Stored profile contains duplicated access roles"
  )

export const profileIdentitySchema = z.object({
  userId: z.string().trim().min(1),
  eventId: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  email: z.string().trim().email(),
  avatarUrl: z.string().url().nullable(),
})

const optionalBioSchema = z
  .union([
    z.string().trim().max(200, "A biografia deve ter no máximo 200 caracteres"),
    z.null(),
  ])
  .transform((value) => value || null)

const optionalRoleSchema = z
  .union([
    z
      .string()
      .trim()
      .max(80, "O cargo ou atuação deve ter no máximo 80 caracteres"),
    z.null(),
  ])
  .transform((value) => value || null)

const optionalCompanySchema = z
  .union([
    z.string().trim().max(100, "A empresa deve ter no máximo 100 caracteres"),
    z.null(),
  ])
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
  .union([
    z
      .string()
      .trim()
      .refine((value) => !value || isHttpUrl(value), {
        message: "Informe um link HTTP ou HTTPS válido",
      }),
    z.null(),
  ])
  .transform((value) => value || null)

const skillSchema = z
  .string()
  .trim()
  .refine(isValidSkillSlug, "Selecione uma habilidade válida")

const selectedSkillsSchema = z
  .array(skillSchema)
  .min(3, "Selecione pelo menos 3 habilidades")
  .max(5, "Selecione no máximo 5 habilidades")
  .refine(
    (selectedSkills) => new Set(selectedSkills).size === selectedSkills.length,
    "Não selecione a mesma habilidade mais de uma vez"
  )

const storedSkillsSchema = z
  .array(skillSchema)
  .max(5)
  .refine(
    (selectedSkills) =>
      selectedSkills.length === 0 || selectedSkills.length >= 3,
    "Stored profile must have no skills or at least 3 skills"
  )
  .refine(
    (selectedSkills) => new Set(selectedSkills).size === selectedSkills.length,
    "Stored profile contains duplicated skills"
  )

export const profileUpdateSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(3, "O nome deve ter no mínimo 3 caracteres"),
    bio: optionalBioSchema,
    role: optionalRoleSchema,
    company: optionalCompanySchema,
    link: optionalLinkSchema,
    skills: selectedSkillsSchema,
  })
  .strict()

export const storedProfileFieldsSchema = z.object({
  bio: z.string().trim().max(200).nullable().default(null),
  role: z.string().trim().max(80).nullable().default(null),
  company: z.string().trim().max(100).nullable().default(null),
  link: httpUrlSchema.nullable().default(null),
  skills: storedSkillsSchema.default([]),
  accessRoles: accessRolesSchema.default(["participant"]),
  ticketBalance: z.number().int().nonnegative().default(0),
  convertedXp: z.number().int().nonnegative().default(0),
})

export type StoredProfileFields = z.infer<typeof storedProfileFieldsSchema>

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>

export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>

export type ProfileIdentity = z.infer<typeof profileIdentitySchema>
export type AccessRole = z.infer<typeof accessRoleSchema>
