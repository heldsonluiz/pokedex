import type { Metadata } from "next"

import { env } from "@/env"
import { QrScanner } from "@/modules/scanner/qr-scanner"

export const metadata: Metadata = {
  title: "Scanner",
}

export default function ScanPage() {
  return <QrScanner appUrl={env.NEXT_PUBLIC_APP_URL} eventId={env.EVENT_ID} />
}
