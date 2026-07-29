"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"

import { requireAuth } from "@/lib/require-auth"

import { redeemRewardForSession } from "./reward.service"

export type RewardRedemptionActionState = Readonly<{
  success: boolean
  message?: string
}>

export async function redeemRewardAction(
  _previousState: RewardRedemptionActionState,
  formData: FormData
): Promise<RewardRedemptionActionState> {
  const session = await requireAuth()

  try {
    const result = await redeemRewardForSession(session, {
      rewardId: formData.get("rewardId"),
      participantQrId: formData.get("participantQrId"),
      participantToken: formData.get("participantToken"),
      idempotencyKey: formData.get("idempotencyKey"),
    })

    if (result.success) {
      revalidatePath(
        `/operations/participant/${String(formData.get("participantQrId"))}`
      )
      revalidatePath("/tickets")

      return {
        success: true,
        message:
          result.code === "already-redeemed"
            ? "Este resgate já havia sido concluído."
            : `${result.rewardName} resgatado com sucesso.`,
      }
    }

    const messages = {
      FORBIDDEN: "O atendimento não está autorizado ou o QR Code expirou.",
      "insufficient-tickets": "O participante não possui tickets suficientes.",
      "limit-reached": "O participante já atingiu o limite deste brinde.",
      "not-found": "O brinde não está mais disponível.",
      "out-of-stock": "O estoque deste brinde acabou.",
      "profile-unavailable": "O perfil do participante não está disponível.",
      "redemption-disabled": "Os resgates estão bloqueados.",
    } as const

    return { success: false, message: messages[result.code] }
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, message: "Os dados do resgate são inválidos." }
    }

    console.error("Failed to redeem participant reward", error)

    return { success: false, message: "Não foi possível concluir o resgate." }
  }
}
