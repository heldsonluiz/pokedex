"use client"

import { useEffect, useRef, useState } from "react"

import {
  AnimatedXpReward,
  MissionCompletionBadge,
} from "@/components/motion/achievement-celebration"
import { QrResult } from "@/modules/qr-code/qr-result"

import {
  completeQrMissionAction,
  type MissionActionResult,
} from "./mission.actions"

type State =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "complete"; result: MissionActionResult }>

const MISSION_COMPLETION_TIMEOUT_MS = 15_000

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
  const requestRef = useRef<Promise<MissionActionResult> | null>(null)
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let active = true
    requestRef.current ??= completeQrMissionAction({ eventId, qrId })

    const timeoutId = window.setTimeout(() => {
      if (active) {
        setState({
          status: "complete",
          result: { success: false, code: "UNEXPECTED_ERROR" },
        })
      }
    }, MISSION_COMPLETION_TIMEOUT_MS)

    void requestRef.current
      .then((result) => {
        if (active) setState({ status: "complete", result })
      })
      .catch(() => {
        if (active) {
          setState({
            status: "complete",
            result: { success: false, code: "UNEXPECTED_ERROR" },
          })
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId)
      })

    return () => {
      active = false
      window.clearTimeout(timeoutId)
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
      icon={
        <MissionCompletionBadge
          imageUrl={state.result.missionImageUrl ?? undefined}
          title={state.result.missionTitle}
          celebrate={!repeated}
        />
      }
      secondaryActionHref="/scan"
      secondaryActionLabel="Voltar para o scanner"
      title={
        repeated
          ? "Missão já concluída"
          : `${state.result.missionTitle} concluída`
      }
      description={
        repeated
          ? `Você já recebeu ${state.result.xpAwarded} XP por esta missão.`
          : "Seu progresso e sua pontuação foram atualizados."
      }
      subtitle={repeated ? "" : `${state.result.missionDescription}`}
    >
      {!repeated && <AnimatedXpReward amount={state.result.xpAwarded} />}
    </QrResult>
  )
}
