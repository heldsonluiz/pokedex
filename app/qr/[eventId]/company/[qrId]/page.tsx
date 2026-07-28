import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { env } from "@/env"
import { auth } from "@/lib/auth"
import { CompanyVisitResult } from "@/modules/companies/company-visit-result"
import { parseQrCodeUrl } from "@/modules/qr-code/qr-code.contract"
import { QrResult } from "@/modules/qr-code/qr-result"

export const metadata: Metadata = {
  title: "Visita à empresa",
}

type CompanyQrCodePageProps = Readonly<{
  params: Promise<{
    eventId: string
    qrId: string
  }>
}>

export default async function CompanyQrCodePage({
  params,
}: CompanyQrCodePageProps) {
  const [{ eventId, qrId }, session] = await Promise.all([params, auth()])
  const requestedUrl = new URL(
    `/qr/${encodeURIComponent(eventId)}/company/${encodeURIComponent(qrId)}`,
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
            : "Não foi possível reconhecer este código de empresa."
        }
      />
    )
  }

  if (parsedQrCode.target.type !== "company") {
    return (
      <QrResult
        status="error"
        title="QR Code inválido"
        description="O tipo deste código não corresponde a uma empresa."
      />
    )
  }

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`)
  }

  return (
    <CompanyVisitResult
      eventId={parsedQrCode.target.eventId}
      qrId={parsedQrCode.target.qrId}
    />
  )
}
