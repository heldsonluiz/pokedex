import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { env } from "@/env"
import { auth } from "@/lib/auth"
import { parseQrCodeUrl } from "@/modules/qr-code/qr-code.contract"
import { QrResult } from "@/modules/qr-code/qr-result"
import { TagDiscoveryResult } from "@/modules/tags/tag-discovery-result"

export const metadata: Metadata = {
  title: "Descoberta de tag",
}

type TagQrCodePageProps = Readonly<{
  params: Promise<{
    eventId: string
    qrId: string
  }>
}>

export default async function TagQrCodePage({ params }: TagQrCodePageProps) {
  const [{ eventId, qrId }, session] = await Promise.all([params, auth()])
  const requestedUrl = new URL(
    `/qr/${encodeURIComponent(eventId)}/tag/${encodeURIComponent(qrId)}`,
    env.NEXT_PUBLIC_APP_URL
  )
  const callbackPath = requestedUrl.pathname
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
            : "Não foi possível reconhecer este código de tag."
        }
      />
    )
  }

  if (parsedQrCode.target.type !== "tag") {
    return (
      <QrResult
        status="error"
        title="QR Code inválido"
        description="O tipo deste código não corresponde a uma tag."
      />
    )
  }

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`)
  }

  return (
    <TagDiscoveryResult
      eventId={parsedQrCode.target.eventId}
      qrId={parsedQrCode.target.qrId}
    />
  )
}
