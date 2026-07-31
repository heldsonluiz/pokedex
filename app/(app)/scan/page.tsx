import type { Metadata } from "next"

import { env } from "@/env"
import { requireAuth } from "@/lib/require-auth"
import { hasPermission } from "@/modules/profile/profile.authorization"
import { requireProfileForSession } from "@/modules/profile/profile.service"
import { QrScanner } from "@/modules/scanner/qr-scanner"

export const metadata: Metadata = {
  title: "Scanner",
}

export default async function ScanPage() {
  const session = await requireAuth()
  const profile = await requireProfileForSession(session)
  const mode = hasPermission(profile, "serve-participants")
    ? { type: "participant-service" as const, title: "Atender participante" }
    : undefined

  return (
    <QrScanner
      appUrl={env.NEXT_PUBLIC_APP_URL}
      eventId={env.EVENT_ID}
      mode={mode}
    />
  )
}
