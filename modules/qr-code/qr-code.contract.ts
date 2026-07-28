import * as z from "zod"

export const QR_CODE_TYPES = ["user", "company", "talk", "mission"] as const
export const MAX_QR_CODE_URL_LENGTH = 4_096
export const MAX_QR_CODE_TOKEN_LENGTH = 2_048

export const qrCodeTypeSchema = z.enum(QR_CODE_TYPES)

const qrCodeBaseTargetSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  qrId: z.string().uuid(),
})

const userQrCodeTargetSchema = qrCodeBaseTargetSchema
  .extend({
    type: z.literal("user"),
    token: z.string().min(1).max(MAX_QR_CODE_TOKEN_LENGTH),
  })
  .strict()

const staticQrCodeTargetSchema = qrCodeBaseTargetSchema
  .extend({
    type: z.enum(["company", "talk", "mission"]),
  })
  .strict()

export const qrCodeTargetSchema = z.discriminatedUnion("type", [
  userQrCodeTargetSchema,
  staticQrCodeTargetSchema,
])

export type QrCodeTarget = z.infer<typeof qrCodeTargetSchema>

export type ParseQrCodeUrlResult =
  | {
      valid: true
      target: QrCodeTarget
    }
  | {
      valid: false
      code:
        | "INVALID_QR"
        | "INVALID_ORIGIN"
        | "INVALID_EVENT"
        | "UNSUPPORTED_QR_TYPE"
        | "MISSING_TOKEN"
    }

type QrCodeUrlConfig = Readonly<{
  appUrl: string
  eventId: string
}>

function decodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return null
  }
}

export function parseQrCodeUrl(
  input: unknown,
  config: QrCodeUrlConfig
): ParseQrCodeUrlResult {
  if (typeof input !== "string") {
    return { valid: false, code: "INVALID_QR" }
  }

  const value = input.trim()

  if (!value || value.length > MAX_QR_CODE_URL_LENGTH) {
    return { valid: false, code: "INVALID_QR" }
  }

  try {
    const url = new URL(value)
    const appOrigin = new URL(config.appUrl).origin

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.origin !== appOrigin ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return { valid: false, code: "INVALID_ORIGIN" }
    }

    const pathSegments = url.pathname.split("/")

    if (
      pathSegments.length !== 5 ||
      pathSegments[0] !== "" ||
      pathSegments[1] !== "qr"
    ) {
      return { valid: false, code: "INVALID_QR" }
    }

    const eventId = decodePathSegment(pathSegments[2])
    const type = decodePathSegment(pathSegments[3])
    const qrId = decodePathSegment(pathSegments[4])

    if (!eventId || !type || !qrId) {
      return { valid: false, code: "INVALID_QR" }
    }

    if (eventId !== config.eventId) {
      return { valid: false, code: "INVALID_EVENT" }
    }

    const typeResult = qrCodeTypeSchema.safeParse(type)

    if (!typeResult.success) {
      return { valid: false, code: "UNSUPPORTED_QR_TYPE" }
    }

    const queryKeys = [...url.searchParams.keys()]

    if (typeResult.data === "user") {
      const tokens = url.searchParams.getAll("token")

      if (tokens.length !== 1 || !tokens[0]) {
        return { valid: false, code: "MISSING_TOKEN" }
      }

      if (queryKeys.length !== 1 || queryKeys[0] !== "token") {
        return { valid: false, code: "INVALID_QR" }
      }

      const targetResult = userQrCodeTargetSchema.safeParse({
        eventId,
        type: typeResult.data,
        qrId,
        token: tokens[0],
      })

      return targetResult.success
        ? { valid: true, target: targetResult.data }
        : { valid: false, code: "INVALID_QR" }
    }

    if (queryKeys.length > 0) {
      return { valid: false, code: "INVALID_QR" }
    }

    const targetResult = staticQrCodeTargetSchema.safeParse({
      eventId,
      type: typeResult.data,
      qrId,
    })

    return targetResult.success
      ? { valid: true, target: targetResult.data }
      : { valid: false, code: "INVALID_QR" }
  } catch {
    return { valid: false, code: "INVALID_QR" }
  }
}

export function buildQrCodeUrl(target: QrCodeTarget, appUrl: string): string {
  const validatedTarget = qrCodeTargetSchema.parse(target)
  const url = new URL(
    `/qr/${encodeURIComponent(validatedTarget.eventId)}/${validatedTarget.type}/${validatedTarget.qrId}`,
    appUrl
  )

  if (validatedTarget.type === "user") {
    url.searchParams.set("token", validatedTarget.token)
  }

  return url.toString()
}
