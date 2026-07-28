"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { requireAuth } from "@/lib/require-auth"

import type { ProfileUpdateInput } from "./profile.schema"
import { updateProfileForSession } from "./profile.service"

type ProfileField = keyof ProfileUpdateInput
type ProfileFieldErrors = Partial<Record<ProfileField, string>>
const PROFILE_FIELDS = [
  "displayName",
  "bio",
  "role",
  "company",
  "link",
  "skills",
] as const satisfies readonly ProfileField[]

export type UpdateProfileActionResult =
  | {
      success: true
    }
  | {
      success: false
      message: string
      fieldErrors?: ProfileFieldErrors
    }

function getFieldErrors(error: ZodError): ProfileFieldErrors {
  const fieldErrors: ProfileFieldErrors = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    const profileField = PROFILE_FIELDS.find((candidate) => candidate === field)

    if (profileField && !fieldErrors[profileField]) {
      fieldErrors[profileField] = issue.message
    }
  }

  return fieldErrors
}

export async function updateProfileAction(
  input: unknown
): Promise<UpdateProfileActionResult> {
  const session = await requireAuth()

  try {
    await updateProfileForSession(session, input)
    revalidatePath("/profile")

    return {
      success: true,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Revise os campos destacados.",
        fieldErrors: getFieldErrors(error),
      }
    }

    console.error("Failed to update authenticated profile", error)

    return {
      success: false,
      message: "Não foi possível salvar o perfil. Tente novamente.",
    }
  }
}
