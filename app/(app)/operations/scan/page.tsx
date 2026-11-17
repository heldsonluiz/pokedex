import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { env } from "@/env"
import { requireAuth } from "@/lib/require-auth"
import { QrScanner } from "@/modules/scanner/qr-scanner"
import { getOperationsForSession } from "@/modules/tickets/ticket.service"

export const metadata: Metadata = {
  title: "Atender participante",
  description:
    "Consulte os dados necessários ao atendimento autorizado de um participante.",
}

export default async function OperationsScanPage() {
  const session = await requireAuth()
  const operations = await getOperationsForSession(session)

  if (!operations) {
    notFound()
  }

  return (
    <QrScanner
      appUrl={env.NEXT_PUBLIC_APP_URL}
      eventId={env.EVENT_ID}
      mode={{ type: "participant-service", title: "Atender participante" }}
    />
  )
}
