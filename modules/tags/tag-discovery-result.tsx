"use client"

import { useEffect, useRef, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { QrResult } from "@/modules/qr-code/qr-result"

import { discoverTagAction, type DiscoverTagActionResult } from "./tag.actions"

type TagDiscoveryState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "complete"; result: DiscoverTagActionResult }>

const tagDiscoveryErrorMessages: Record<
  Extract<DiscoverTagActionResult, { success: false }>["code"],
  Readonly<{ title: string; description: string }>
> = {
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
    description: "Finalize seu perfil antes de encontrar tags e receber XP.",
  },
  TAG_INACTIVE: {
    title: "Tag indisponível",
    description: "Esta tag não pode ser descoberta neste momento.",
  },
  TAG_NOT_FOUND: {
    title: "Tag não encontrada",
    description: "Este QR Code não está associado a uma tag do evento.",
  },
  UNEXPECTED_ERROR: {
    title: "Não foi possível registrar a tag",
    description: "Tente novamente. Sua pontuação não será duplicada.",
  },
}

export function TagDiscoveryResult({
  eventId,
  qrId,
}: Readonly<{ eventId: string; qrId: string }>) {
  const startedRef = useRef(false)
  const [state, setState] = useState<TagDiscoveryState>({
    status: "loading",
  })

  useEffect(() => {
    if (startedRef.current) {
      return
    }

    startedRef.current = true
    let active = true

    void discoverTagAction({ eventId, qrId }).then((result) => {
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
        title="Revelando a tag"
        description="Aguarde enquanto verificamos sua descoberta e pontuação."
      />
    )
  }

  if (!state.result.success) {
    const feedback = tagDiscoveryErrorMessages[state.result.code]

    return (
      <QrResult
        status="error"
        title={feedback.title}
        description={feedback.description}
      />
    )
  }

  const alreadyDiscovered = state.result.code === "TAG_ALREADY_DISCOVERED"

  return (
    <QrResult
      status="success"
      title={
        alreadyDiscovered
          ? `${state.result.tagName} já foi encontrada`
          : `${state.result.tagName} revelada`
      }
      description={
        alreadyDiscovered
          ? `Você já recebeu ${state.result.xpAwarded} XP por esta tag.`
          : `Você encontrou uma nova tag e recebeu ${state.result.xpAwarded} XP.`
      }
      actionHref="/tags"
      actionLabel="Ver coleção de tags"
    >
      <Avatar className="size-28 rounded-3xl">
        <AvatarImage
          src={state.result.imageUrl}
          alt={`Imagem da tag ${state.result.tagName}`}
          className="rounded-3xl object-contain"
        />
        <AvatarFallback className="rounded-3xl">TAG</AvatarFallback>
      </Avatar>
    </QrResult>
  )
}
