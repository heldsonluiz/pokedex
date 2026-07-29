"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { requireAuth } from "@/lib/require-auth"

import {
  convertParticipantXpForSession,
  convertXpForSession,
  updateConversionAvailabilityForSession,
  updateRedemptionAvailabilityForSession,
} from "./ticket.service"

export type TicketConversionActionState = Readonly<{
  success: boolean
  message?: string
  fieldError?: string
}>

export async function convertXpAction(
  _previousState: TicketConversionActionState,
  formData: FormData
): Promise<TicketConversionActionState> {
  const session = await requireAuth()

  try {
    const result = await convertXpForSession(session, {
      ticketAmount: formData.get("ticketAmount"),
      idempotencyKey: formData.get("idempotencyKey"),
    })

    if (result.success) {
      revalidatePath("/tickets")
      revalidatePath("/profile")

      return {
        success: true,
        message:
          result.code === "ALREADY_CONVERTED"
            ? "Esta conversão já havia sido concluída."
            : `${result.ticketAmount} ${result.ticketAmount === 1 ? "ticket convertido" : "tickets convertidos"} com sucesso.`,
      }
    }

    const messages = {
      CONVERSION_DISABLED: "A conversão de XP está temporariamente bloqueada.",
      FORBIDDEN: "Esta conta não pode converter XP.",
      INSUFFICIENT_XP: "Você não possui XP disponível para essa conversão.",
    } as const

    return { success: false, message: messages[result.code] }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Revise a quantidade informada.",
        fieldError:
          error.issues.find((issue) => issue.path[0] === "ticketAmount")
            ?.message ?? "Informe uma quantidade válida.",
      }
    }

    console.error("Failed to convert participant XP to tickets", error)

    return {
      success: false,
      message: "Não foi possível converter o XP. Tente novamente.",
    }
  }
}

export async function convertParticipantXpAction(
  _previousState: TicketConversionActionState,
  formData: FormData
): Promise<TicketConversionActionState> {
  const session = await requireAuth()

  try {
    const result = await convertParticipantXpForSession(session, {
      participantQrId: formData.get("participantQrId"),
      participantToken: formData.get("participantToken"),
      ticketAmount: formData.get("ticketAmount"),
      idempotencyKey: formData.get("idempotencyKey"),
    })

    if (result.success) {
      revalidatePath("/operations")
      revalidatePath(
        `/operations/participant/${String(formData.get("participantQrId"))}`
      )

      return {
        success: true,
        message: `${result.ticketAmount} ${result.ticketAmount === 1 ? "ticket convertido" : "tickets convertidos"} com sucesso.`,
      }
    }

    const messages = {
      "conversion-disabled": "As conversões estão bloqueadas.",
      "insufficient-xp": "O participante não possui XP suficiente.",
      "profile-unavailable": "O perfil do participante não está disponível.",
      FORBIDDEN: "O atendimento não está autorizado ou o QR Code expirou.",
    } as const

    return {
      success: false,
      message: messages[result.code],
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Revise a quantidade informada.",
        fieldError:
          error.issues.find((issue) => issue.path[0] === "ticketAmount")
            ?.message ?? "Informe uma quantidade válida.",
      }
    }

    console.error("Failed to convert participant XP during service", error)

    return {
      success: false,
      message: "Não foi possível concluir o atendimento.",
    }
  }
}

export async function toggleTicketConversionAction(formData: FormData) {
  const session = await requireAuth()
  const enabled = formData.get("enabled") === "true"
  const updated = await updateConversionAvailabilityForSession(session, enabled)

  if (!updated) {
    throw new Error("Operation is not authorized")
  }

  revalidatePath("/operations")
  revalidatePath("/tickets")
}

export async function toggleRewardRedemptionAction(formData: FormData) {
  const session = await requireAuth()
  const enabled = formData.get("enabled") === "true"
  const updated = await updateRedemptionAvailabilityForSession(session, enabled)

  if (!updated) {
    throw new Error("Operation is not authorized")
  }

  revalidatePath("/operations")
}
