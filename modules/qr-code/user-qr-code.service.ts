import "server-only"

import type { Session } from "next-auth"
import { toString } from "qrcode"

import { env } from "@/env"
import { requireProfileForSession } from "@/modules/profile/profile.service"

import { createUserQrToken } from "./user-qr-token"

export type UserQrCode = {
  value: string
  svg: string
  expiresAt: string
}

export async function issueUserQrCode(session: Session): Promise<UserQrCode> {
  const profile = await requireProfileForSession(session)
  const { token, expiresAt } = createUserQrToken({
    eventId: profile.eventId,
    qrId: profile.qrId,
  })
  const qrUrl = new URL(
    `/qr/${encodeURIComponent(profile.eventId)}/user/${profile.qrId}`,
    env.NEXT_PUBLIC_APP_URL
  )
  qrUrl.searchParams.set("token", token)

  const svg = await toString(qrUrl.toString(), {
    type: "svg",
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#020617",
      light: "#ffffff",
    },
  })

  return {
    value: qrUrl.toString(),
    svg,
    expiresAt: expiresAt.toISOString(),
  }
}
