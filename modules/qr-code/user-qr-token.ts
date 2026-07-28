import "server-only"

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

import * as z from "zod"

import { env } from "@/env"

const USER_QR_TOKEN_VERSION = 1
const USER_QR_TOKEN_DURATION_SECONDS = 60
const CLOCK_TOLERANCE_SECONDS = 5

const userQrTokenPayloadSchema = z.object({
  version: z.literal(USER_QR_TOKEN_VERSION),
  eventId: z.string().trim().min(1),
  type: z.literal("user"),
  qrId: z.string().uuid(),
  issuedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
  nonce: z.string().min(1),
})

type UserQrTokenPayload = z.infer<typeof userQrTokenPayloadSchema>

export type ValidateUserQrTokenResult =
  | {
      valid: true
      payload: UserQrTokenPayload
    }
  | {
      valid: false
      code: "INVALID_QR" | "INVALID_EVENT" | "QR_EXPIRED"
    }

function sign(encodedPayload: string) {
  return createHmac("sha256", env.QR_SIGNING_SECRET)
    .update(encodedPayload)
    .digest()
}

export function createUserQrToken({
  eventId,
  qrId,
  now = new Date(),
}: {
  eventId: string
  qrId: string
  now?: Date
}) {
  const issuedAt = Math.floor(now.getTime() / 1000)
  const payload = userQrTokenPayloadSchema.parse({
    version: USER_QR_TOKEN_VERSION,
    eventId,
    type: "user",
    qrId,
    issuedAt,
    expiresAt: issuedAt + USER_QR_TOKEN_DURATION_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  })
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  )
  const signature = sign(encodedPayload).toString("base64url")

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.expiresAt * 1000),
  }
}

export function validateUserQrToken({
  token,
  eventId,
  qrId,
  now = new Date(),
}: {
  token: string
  eventId: string
  qrId: string
  now?: Date
}): ValidateUserQrTokenResult {
  if (token.length > 2_048) {
    return { valid: false, code: "INVALID_QR" }
  }

  const parts = token.split(".")

  if (parts.length !== 2) {
    return { valid: false, code: "INVALID_QR" }
  }

  const [encodedPayload, encodedSignature] = parts

  try {
    const providedSignature = Buffer.from(encodedSignature, "base64url")
    const expectedSignature = sign(encodedPayload)

    if (
      providedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(providedSignature, expectedSignature)
    ) {
      return { valid: false, code: "INVALID_QR" }
    }

    const payload = userQrTokenPayloadSchema.parse(
      JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"))
    )

    if (payload.eventId !== eventId) {
      return { valid: false, code: "INVALID_EVENT" }
    }

    if (payload.qrId !== qrId) {
      return { valid: false, code: "INVALID_QR" }
    }

    if (
      payload.expiresAt - payload.issuedAt !==
      USER_QR_TOKEN_DURATION_SECONDS
    ) {
      return { valid: false, code: "INVALID_QR" }
    }

    const currentTime = Math.floor(now.getTime() / 1000)

    if (currentTime < payload.issuedAt - CLOCK_TOLERANCE_SECONDS) {
      return { valid: false, code: "INVALID_QR" }
    }

    if (currentTime > payload.expiresAt + CLOCK_TOLERANCE_SECONDS) {
      return { valid: false, code: "QR_EXPIRED" }
    }

    return {
      valid: true,
      payload,
    }
  } catch {
    return { valid: false, code: "INVALID_QR" }
  }
}
