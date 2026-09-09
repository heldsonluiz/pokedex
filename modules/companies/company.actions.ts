"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { requireAuth } from "@/lib/require-auth"

import { visitCompanyForSession } from "./company.service"

export type VisitCompanyActionResult =
  | Readonly<{
      success: true
      code: "COMPANY_VISITED" | "COMPANY_ALREADY_VISITED"
      companyName: string
      companyDescription: string | null
      companyLogoUrl: string
      xpAwarded: number
    }>
  | Readonly<{
      success: false
      code:
        | "COMPANY_INACTIVE"
        | "COMPANY_NOT_FOUND"
        | "INVALID_EVENT"
        | "INVALID_INPUT"
        | "PROFILE_INCOMPLETE"
        | "UNEXPECTED_ERROR"
    }>

export async function visitCompanyAction(
  input: unknown
): Promise<VisitCompanyActionResult> {
  const session = await requireAuth()

  try {
    const result = await visitCompanyForSession(session, input)

    if (result.success) {
      revalidatePath("/passport")
    }

    return result
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, code: "INVALID_INPUT" }
    }

    console.error("Failed to complete company visit", error)

    return { success: false, code: "UNEXPECTED_ERROR" }
  }
}
