"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { requireAuth } from "@/lib/require-auth"

import {
  completeKeywordMissionForSession,
  completeQrMissionForSession,
  completeQuizMissionForSession,
  type MissionOperationResult,
  reviewMissionForSession,
} from "./mission.service"

export type MissionActionResult =
  | MissionOperationResult
  | Readonly<{
      success: false
      code: "INVALID_INPUT" | "UNEXPECTED_ERROR"
    }>

export async function completeQrMissionAction(
  input: unknown
): Promise<MissionActionResult> {
  return runMissionAction(input, completeQrMissionForSession)
}

export async function reviewMissionAction(
  input: unknown
): Promise<MissionActionResult> {
  return runMissionAction(input, reviewMissionForSession)
}

async function runMissionAction(
  input: unknown,
  operation: typeof completeQrMissionForSession
): Promise<MissionActionResult> {
  const session = await requireAuth()

  try {
    const result = await operation(session, input)

    if (
      result.success ||
      result.code === "ATTEMPTS_EXHAUSTED" ||
      result.code === "QUIZ_NOT_PASSED" ||
      result.code === "INCORRECT_ANSWER"
    ) {
      revalidatePath("/missions")
      revalidatePath("/passport")
    }

    return result
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, code: "INVALID_INPUT" }
    }

    console.error("Failed to complete mission", error)

    return { success: false, code: "UNEXPECTED_ERROR" }
  }
}

export async function completeKeywordMissionAction(
  input: unknown
): Promise<MissionActionResult> {
  return runMissionAction(input, completeKeywordMissionForSession)
}

export async function completeQuizMissionAction(
  input: unknown
): Promise<MissionActionResult> {
  return runMissionAction(input, completeQuizMissionForSession)
}
