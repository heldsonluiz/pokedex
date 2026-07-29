import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { env } from "@/env"
import { auth } from "@/lib/auth"
import { MissionCompletionResult } from "@/modules/missions/mission-completion-result"
import { parseQrCodeUrl } from "@/modules/qr-code/qr-code.contract"
import { QrResult } from "@/modules/qr-code/qr-result"

export const metadata: Metadata = { title: "Conclusão de missão" }

type PageProps = Readonly<{
  params: Promise<{ eventId: string; qrId: string }>
}>

export default async function MissionQrPage({ params }: PageProps) {
  const [{ eventId, qrId }, session] = await Promise.all([params, auth()])
  const url = new URL(
    `/qr/${encodeURIComponent(eventId)}/mission/${encodeURIComponent(qrId)}`,
    env.NEXT_PUBLIC_APP_URL
  )
  const parsed = parseQrCodeUrl(url.toString(), {
    appUrl: env.NEXT_PUBLIC_APP_URL,
    eventId: env.EVENT_ID,
  })

  if (!parsed.valid || parsed.target.type !== "mission") {
    return (
      <QrResult
        status="error"
        title="QR Code inválido"
        description="Não foi possível reconhecer este código de missão."
      />
    )
  }

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(url.pathname)}`)
  }

  return (
    <MissionCompletionResult
      eventId={parsed.target.eventId}
      qrId={parsed.target.qrId}
    />
  )
}
