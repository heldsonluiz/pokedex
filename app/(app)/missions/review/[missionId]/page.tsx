import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { env } from "@/env"
import { requireAuth } from "@/lib/require-auth"
import { listReviewableMissionsForSession } from "@/modules/missions/mission.service"
import { QrScanner } from "@/modules/scanner/qr-scanner"

export const metadata: Metadata = { title: "Validar missão" }

type PageProps = Readonly<{
  params: Promise<{ missionId: string }>
}>

export default async function ReviewMissionPage({ params }: PageProps) {
  const [{ missionId }, session] = await Promise.all([params, requireAuth()])
  const missions = await listReviewableMissionsForSession(session)
  const mission = missions?.find((item) => item.id === missionId)

  if (!mission) {
    notFound()
  }

  return (
    <QrScanner
      appUrl={env.NEXT_PUBLIC_APP_URL}
      eventId={env.EVENT_ID}
      mode={{ type: "mission-review", missionId, title: mission.title }}
    />
  )
}
