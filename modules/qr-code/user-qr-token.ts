import "server-only"

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

import * as z from "zod"

import { env } from "@/env"

const USER_QR_TOKEN_VERSION = 3
const USER_QR_TOKEN_DURATION_SECONDS = 60
const CLOCK_TOLERANCE_SECONDS = 5
const TOKEN_PAYLOAD_LENGTH = 17
const TOKEN_SIGNATURE_LENGTH = 16
const TOKEN_LENGTH = TOKEN_PAYLOAD_LENGTH + TOKEN_SIGNATURE_LENGTH
const ENCODED_TOKEN_LENGTH = 44
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{44}$/

const userQrTokenContextSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  qrId: z.string().uuid(),
})

const issuedAtSchema = z.number().int().nonnegative().max(0xffffffff)

type UserQrTokenPayload = Readonly<{
  version: typeof USER_QR_TOKEN_VERSION
  eventId: string
  type: "user"
  qrId: string
  issuedAt: number
  expiresAt: number
  nonce: string
}>

export type ValidateUserQrTokenResult =
  | {
      valid: true
      payload: UserQrTokenPayload
    }
  | {
      valid: false
      code: "INVALID_QR" | "QR_EXPIRED"
    }

function sign({
  payload,
  eventId,
  qrId,
}: {
  payload: Buffer
  eventId: string
  qrId: string
}) {
  const signedContext = Buffer.from(
    JSON.stringify([eventId, "user", qrId]),
    "utf8"
  )
  const contextLength = Buffer.allocUnsafe(4)
  contextLength.writeUInt32BE(signedContext.length)

  return createHmac("sha256", env.QR_SIGNING_SECRET)
    .update(contextLength)
    .update(signedContext)
    .update(payload)
    .digest()
    .subarray(0, TOKEN_SIGNATURE_LENGTH)
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
  const context = userQrTokenContextSchema.parse({ eventId, qrId })
  const issuedAt = issuedAtSchema.parse(Math.floor(now.getTime() / 1000))
  const payload = Buffer.allocUnsafe(TOKEN_PAYLOAD_LENGTH)

  payload.writeUInt8(USER_QR_TOKEN_VERSION, 0)
  payload.writeUInt32BE(issuedAt, 1)
  randomBytes(12).copy(payload, 5)

  const signature = sign({
    payload,
    eventId: context.eventId,
    qrId: context.qrId,
  })
  const token = Buffer.concat([payload, signature]).toString("base64url")

  return {
    token,
    expiresAt: new Date((issuedAt + USER_QR_TOKEN_DURATION_SECONDS) * 1000),
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
  if (token.length !== ENCODED_TOKEN_LENGTH || !TOKEN_PATTERN.test(token)) {
    return { valid: false, code: "INVALID_QR" }
  }

  const context = userQrTokenContextSchema.safeParse({ eventId, qrId })

  if (!context.success) {
    return { valid: false, code: "INVALID_QR" }
  }

  try {
    const decodedToken = Buffer.from(token, "base64url")

    if (decodedToken.length !== TOKEN_LENGTH) {
      return { valid: false, code: "INVALID_QR" }
    }

    const payload = decodedToken.subarray(0, TOKEN_PAYLOAD_LENGTH)
    const providedSignature = decodedToken.subarray(TOKEN_PAYLOAD_LENGTH)
    const expectedSignature = sign({
      payload,
      eventId: context.data.eventId,
      qrId: context.data.qrId,
    })

    if (
      providedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(providedSignature, expectedSignature)
    ) {
      return { valid: false, code: "INVALID_QR" }
    }

    const version = payload.readUInt8(0)

    if (version !== USER_QR_TOKEN_VERSION) {
      return { valid: false, code: "INVALID_QR" }
    }

    const issuedAt = payload.readUInt32BE(1)
    const expiresAt = issuedAt + USER_QR_TOKEN_DURATION_SECONDS
    const currentTime = Math.floor(now.getTime() / 1000)

    if (currentTime < issuedAt - CLOCK_TOLERANCE_SECONDS) {
      return { valid: false, code: "INVALID_QR" }
    }

    if (currentTime > expiresAt + CLOCK_TOLERANCE_SECONDS) {
      return { valid: false, code: "QR_EXPIRED" }
    }

    return {
      valid: true,
      payload: {
        version,
        eventId: context.data.eventId,
        type: "user",
        qrId: context.data.qrId,
        issuedAt,
        expiresAt,
        nonce: payload.subarray(5).toString("base64url"),
      },
    }
  } catch {
    return { valid: false, code: "INVALID_QR" }
  }
}
