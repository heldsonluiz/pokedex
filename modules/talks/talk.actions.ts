"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { ZodError } from "zod"

import { CACHE_TAGS } from "@/config/cache"
import { requireAuth } from "@/lib/require-auth"

import {
  submitTalkRatingForSession,
  updateTalkEvaluationStatusForSession,
} from "./talk.service"
import type { SubmitTalkRatingInput } from "./talk-rating.schema"

type RatingField = keyof Omit<SubmitTalkRatingInput, "talkId">
type RatingFieldErrors = Partial<Record<RatingField, string>>

export type TalkRatingActionState = Readonly<{
  success: boolean
  message?: string
  fieldErrors?: RatingFieldErrors
}>

export type TalkEvaluationStatusActionState = Readonly<{
  success: boolean
  message?: string
}>

const RATING_FIELDS = [
  "speakerRating",
  "contentRating",
  "comprehensionRating",
  "comment",
] as const satisfies readonly RatingField[]

function getRatingFieldErrors(error: ZodError): RatingFieldErrors {
  const fieldErrors: RatingFieldErrors = {}

  for (const issue of error.issues) {
    const field = RATING_FIELDS.find((candidate) => candidate === issue.path[0])

    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

export async function submitTalkRatingAction(
  _previousState: TalkRatingActionState,
  formData: FormData
): Promise<TalkRatingActionState> {
  const session = await requireAuth()

  try {
    const result = await submitTalkRatingForSession(session, {
      talkId: String(formData.get("talkId") ?? ""),
      speakerRating: Number(formData.get("speakerRating")),
      contentRating: Number(formData.get("contentRating")),
      comprehensionRating: Number(formData.get("comprehensionRating")),
      comment: String(formData.get("comment") ?? ""),
    })

    if (!result.success) {
      const messages = {
        EVALUATION_CLOSED: "A avaliação desta palestra foi encerrada.",
        EVALUATION_LOCKED: "A avaliação desta palestra ainda não foi liberada.",
        PROFILE_UNAVAILABLE: "Seu perfil não está disponível para participar.",
        TALK_INACTIVE: "Esta palestra não está mais disponível.",
        TALK_NOT_FOUND: "A palestra não foi encontrada.",
      }

      return { success: false, message: messages[result.code] }
    }

    revalidatePath("/talks")
    revalidatePath(
      `/talks/${encodeURIComponent(String(formData.get("talkId")))}`
    )
    revalidatePath("/home")
    revalidatePath("/profile")
    revalidatePath("/ranking")

    return {
      success: true,
      message:
        result.code === "RATED"
          ? `Avaliação enviada. Você recebeu ${result.xpAwarded} XP.`
          : "Você já havia avaliado esta palestra. Nenhum XP adicional foi concedido.",
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Revise os campos destacados.",
        fieldErrors: getRatingFieldErrors(error),
      }
    }

    console.error("Failed to submit talk rating", error)

    return {
      success: false,
      message: "Não foi possível enviar a avaliação. Tente novamente.",
    }
  }
}

export async function updateTalkEvaluationStatusAction(
  _previousState: TalkEvaluationStatusActionState,
  formData: FormData
): Promise<TalkEvaluationStatusActionState> {
  const session = await requireAuth()

  try {
    const result = await updateTalkEvaluationStatusForSession(session, {
      id: String(formData.get("talkId") ?? ""),
      evaluationStatus: String(formData.get("evaluationStatus") ?? ""),
    })

    if (!result.success) {
      const messages = {
        FORBIDDEN: "Sua conta não pode alterar avaliações.",
        TALK_INACTIVE: "Esta palestra não está ativa.",
        TALK_NOT_FOUND: "A palestra não foi encontrada.",
      }

      return { success: false, message: messages[result.code] }
    }

    revalidateTag(CACHE_TAGS.TALKS, { expire: 0 })
    revalidatePath("/operations")
    revalidatePath("/talks")

    return { success: true, message: "Estado da avaliação atualizado." }
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, message: "Estado de avaliação inválido." }
    }

    console.error("Failed to update talk evaluation status", error)

    return {
      success: false,
      message: "Não foi possível atualizar a avaliação. Tente novamente.",
    }
  }
}
