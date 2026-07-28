"use client"

import { useEffect, useRef, useState } from "react"

import { QrResult } from "@/modules/qr-code/qr-result"

import {
  visitCompanyAction,
  type VisitCompanyActionResult,
} from "./company.actions"

type CompanyVisitState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "complete"; result: VisitCompanyActionResult }>

const companyVisitErrorMessages: Record<
  Extract<VisitCompanyActionResult, { success: false }>["code"],
  Readonly<{ title: string; description: string }>
> = {
  COMPANY_INACTIVE: {
    title: "Visita indisponível",
    description: "Esta empresa não está recebendo visitas neste momento.",
  },
  COMPANY_NOT_FOUND: {
    title: "Empresa não encontrada",
    description: "O QR Code não está associado a uma empresa deste evento.",
  },
  INVALID_EVENT: {
    title: "QR Code de outro evento",
    description: "Este código não pertence à edição atual do evento.",
  },
  INVALID_INPUT: {
    title: "QR Code inválido",
    description: "Não foi possível reconhecer os dados deste código.",
  },
  PROFILE_INCOMPLETE: {
    title: "Complete seu perfil",
    description:
      "Finalize seu perfil antes de registrar visitas e receber pontos.",
  },
  UNEXPECTED_ERROR: {
    title: "Não foi possível registrar a visita",
    description: "Tente novamente. Sua pontuação não será duplicada.",
  },
}

export function CompanyVisitResult({
  eventId,
  qrId,
}: Readonly<{ eventId: string; qrId: string }>) {
  const startedRef = useRef(false)
  const [state, setState] = useState<CompanyVisitState>({
    status: "loading",
  })

  useEffect(() => {
    if (startedRef.current) {
      return
    }

    startedRef.current = true
    let active = true

    void visitCompanyAction({ eventId, qrId }).then((result) => {
      if (active) {
        setState({ status: "complete", result })
      }
    })

    return () => {
      active = false
    }
  }, [eventId, qrId])

  if (state.status === "loading") {
    return (
      <QrResult
        status="loading"
        title="Validando sua visita"
        description="Aguarde enquanto verificamos a empresa e sua pontuação."
      />
    )
  }

  if (!state.result.success) {
    const feedback = companyVisitErrorMessages[state.result.code]

    return (
      <QrResult
        status="error"
        title={feedback.title}
        description={feedback.description}
      />
    )
  }

  const alreadyVisited = state.result.code === "COMPANY_ALREADY_VISITED"

  return (
    <QrResult
      status="success"
      title={
        alreadyVisited
          ? `${state.result.companyName} já está no seu passaporte`
          : `Visita à ${state.result.companyName} registrada`
      }
      description={
        alreadyVisited
          ? `Você já recebeu ${state.result.xpAwarded} XP por esta empresa.`
          : `Você recebeu ${state.result.xpAwarded} XP e adicionou um novo carimbo ao passaporte.`
      }
    />
  )
}
