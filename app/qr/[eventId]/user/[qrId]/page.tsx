import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { env } from "@/env"
import { auth } from "@/lib/auth"
import { getProfileByPublicQrId } from "@/modules/profile/profile.service"
import { parseQrCodeUrl } from "@/modules/qr-code/qr-code.contract"
import { QrResult } from "@/modules/qr-code/qr-result"
import { validateUserQrToken } from "@/modules/qr-code/user-qr-token"

export const metadata: Metadata = {
  title: "QR Code de participante",
}

type UserQrCodePageProps = Readonly<{
  params: Promise<{
    eventId: string
    qrId: string
  }>
  searchParams: Promise<{
    token?: string | string[]
  }>
}>

export default async function UserQrCodePage({
  params,
  searchParams,
}: UserQrCodePageProps) {
  const [{ eventId, qrId }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ])
  const token = typeof query.token === "string" ? query.token : ""
  const requestedUrl = new URL(
    `/qr/${encodeURIComponent(eventId)}/user/${encodeURIComponent(qrId)}`,
    env.NEXT_PUBLIC_APP_URL
  )
  requestedUrl.searchParams.set("token", token)
  const callbackPath = `${requestedUrl.pathname}${requestedUrl.search}`
  const parsedQrCode = parseQrCodeUrl(requestedUrl.toString(), {
    appUrl: env.NEXT_PUBLIC_APP_URL,
    eventId: env.EVENT_ID,
  })

  if (!parsedQrCode.valid) {
    const isDifferentEvent = parsedQrCode.code === "INVALID_EVENT"

    return (
      <QrResult
        status="error"
        title={
          isDifferentEvent ? "QR Code de outro evento" : "QR Code inválido"
        }
        description={
          isDifferentEvent
            ? "Este código não pertence à edição atual do evento."
            : "Não foi possível reconhecer este código."
        }
      />
    )
  }

  if (parsedQrCode.target.type !== "user") {
    return (
      <QrResult
        status="error"
        title="QR Code inválido"
        description="O tipo deste código não corresponde a um participante."
      />
    )
  }

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`)
  }

  const validation = validateUserQrToken({
    token: parsedQrCode.target.token,
    eventId: parsedQrCode.target.eventId,
    qrId: parsedQrCode.target.qrId,
  })

  if (!validation.valid) {
    const isExpired = validation.code === "QR_EXPIRED"

    return (
      <QrResult
        status="error"
        title={isExpired ? "Este QR Code expirou" : "QR Code inválido"}
        description={
          isExpired
            ? "Peça ao participante para abrir novamente o QR Code atualizado."
            : "Não foi possível validar este código."
        }
      />
    )
  }

  const targetProfile = await getProfileByPublicQrId(
    parsedQrCode.target.eventId,
    parsedQrCode.target.qrId
  )

  if (!targetProfile) {
    return (
      <QrResult
        status="error"
        title="Participante não encontrado"
        description="O perfil associado a este QR Code não está disponível."
      />
    )
  }

  if (targetProfile.userId === session.user.id) {
    return (
      <QrResult
        status="error"
        title="Este é o seu QR Code"
        description="Peça para outro participante escanear o código para iniciar uma conexão."
      />
    )
  }

  return (
    <QrResult
      status="success"
      title={targetProfile.displayName}
      description="QR Code válido. Use o scanner do aplicativo para registrar a conexão."
    />
  )
}
