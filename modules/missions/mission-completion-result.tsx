"use client"

import { useEffect, useRef, useState } from "react"

import { QrResult } from "@/modules/qr-code/qr-result"

import {
  completeQrMissionAction,
  type MissionActionResult,
} from "./mission.actions"

type State =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "complete"; result: MissionActionResult }>

const errors: Record<
  Extract<MissionActionResult, { success: false }>["code"],
  Readonly<{ title: string; description: string }>
> = {
  FORBIDDEN: {
    title: "Ação não permitida",
    description: "Esta conta não pode concluir atividades de participante.",
  },
  INVALID_EVENT: {
    title: "QR Code de outro evento",
    description: "Este código não pertence à edição atual.",
  },
  INVALID_INPUT: {
    title: "QR Code inválido",
    description: "Não foi possível reconhecer os dados deste código.",
  },
  INVALID_QR: {
    title: "QR Code inválido",
    description: "Não foi possível validar este código.",
  },
  MISSION_INACTIVE: {
    title: "Missão indisponível",
    description: "Esta missão não pode ser concluída neste momento.",
  },
  MISSION_NOT_FOUND: {
    title: "Missão não encontrada",
    description: "Este código não está associado a uma missão.",
  },
  PREREQUISITE_MISSING: {
    title: "Missão bloqueada",
    description: "Conclua os pré-requisitos antes de realizar esta missão.",
  },
  PROFILE_UNAVAILABLE: {
    title: "Complete seu perfil",
    description: "Finalize a configuração antes de concluir missões.",
  },
  QR_EXPIRED: {
    title: "QR Code expirado",
    description: "Atualize o código e tente novamente.",
  },
  WRONG_VALIDATION_TYPE: {
    title: "Validação presencial necessária",
    description: "Esta missão precisa ser validada por um reviewer.",
  },
  UNEXPECTED_ERROR: {
    title: "Não foi possível concluir",
    description: "Tente novamente. Sua pontuação não será duplicada.",
  },
}

export function MissionCompletionResult({
  eventId,
  qrId,
}: Readonly<{ eventId: string; qrId: string }>) {
  const started = useRef(false)
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    if (started.current) return

    started.current = true
    let active = true

    void completeQrMissionAction({ eventId, qrId }).then((result) => {
      if (active) setState({ status: "complete", result })
    })

    return () => {
      active = false
    }
  }, [eventId, qrId])

  if (state.status === "loading") {
    return (
      <QrResult
        status="loading"
        title="Validando missão"
        description="Aguarde enquanto verificamos a conclusão e a pontuação."
      />
    )
  }

  if (!state.result.success) {
    const feedback = errors[state.result.code]

    return (
      <QrResult
        status="error"
        title={feedback.title}
        description={feedback.description}
      />
    )
  }

  const repeated = state.result.code === "MISSION_ALREADY_COMPLETED"

  return (
    <QrResult
      status="success"
      title={
        repeated
          ? "Missão já concluída"
          : `${state.result.missionTitle} concluída`
      }
      description={
        repeated
          ? `Você já recebeu ${state.result.xpAwarded} XP por esta missão.`
          : `Você recebeu ${state.result.xpAwarded} XP por esta missão.`
      }
    />
  )
}
