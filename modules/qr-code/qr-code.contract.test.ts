import { describe, expect, it } from "vitest"

import {
  buildQrCodeUrl,
  MAX_QR_CODE_URL_LENGTH,
  parseQrCodeUrl,
  type QrCodeTarget,
} from "./qr-code.contract"

const APP_URL = "https://pokedex.example.com"
const EVENT_ID = "devfest-2026"
const QR_ID = "123e4567-e89b-42d3-a456-426614174000"
const TOKEN = "payload.signature"
const config = {
  appUrl: APP_URL,
  eventId: EVENT_ID,
}

function buildUserUrl(overrides?: Partial<QrCodeTarget>) {
  return buildQrCodeUrl(
    {
      eventId: EVENT_ID,
      type: "user",
      qrId: QR_ID,
      token: TOKEN,
      ...overrides,
    } as QrCodeTarget,
    APP_URL
  )
}

describe("QR Code URL contract", () => {
  it("builds and parses a participant QR Code", () => {
    const result = parseQrCodeUrl(buildUserUrl(), config)

    expect(result).toEqual({
      valid: true,
      target: {
        eventId: EVENT_ID,
        type: "user",
        qrId: QR_ID,
        token: TOKEN,
      },
    })
  })

  it.each(["company", "mission", "tag"] as const)(
    "builds and parses a static %s QR Code",
    (type) => {
      const target = {
        eventId: EVENT_ID,
        type,
        qrId: QR_ID,
      }
      const result = parseQrCodeUrl(buildQrCodeUrl(target, APP_URL), config)

      expect(result).toEqual({ valid: true, target })
    }
  )

  it("rejects an external origin", () => {
    const result = parseQrCodeUrl(
      `https://attacker.example/qr/${EVENT_ID}/user/${QR_ID}?token=${TOKEN}`,
      config
    )

    expect(result).toEqual({ valid: false, code: "INVALID_ORIGIN" })
  })

  it("rejects embedded URL credentials", () => {
    const result = parseQrCodeUrl(
      `https://user:password@pokedex.example.com/qr/${EVENT_ID}/user/${QR_ID}?token=${TOKEN}`,
      config
    )

    expect(result).toEqual({ valid: false, code: "INVALID_ORIGIN" })
  })

  it("rejects a QR Code from another event", () => {
    const result = parseQrCodeUrl(
      buildUserUrl({ eventId: "another-event" }),
      config
    )

    expect(result).toEqual({ valid: false, code: "INVALID_EVENT" })
  })

  it("rejects an unsupported target type", () => {
    const result = parseQrCodeUrl(
      `${APP_URL}/qr/${EVENT_ID}/ticket/${QR_ID}`,
      config
    )

    expect(result).toEqual({
      valid: false,
      code: "UNSUPPORTED_QR_TYPE",
    })
  })

  it("requires a participant token", () => {
    const result = parseQrCodeUrl(
      `${APP_URL}/qr/${EVENT_ID}/user/${QR_ID}`,
      config
    )

    expect(result).toEqual({ valid: false, code: "MISSING_TOKEN" })
  })

  it("rejects unexpected query parameters", () => {
    const result = parseQrCodeUrl(`${buildUserUrl()}&source=external`, config)

    expect(result).toEqual({ valid: false, code: "INVALID_QR" })
  })

  it("rejects an invalid UUID", () => {
    const result = parseQrCodeUrl(
      `${APP_URL}/qr/${EVENT_ID}/company/not-a-uuid`,
      config
    )

    expect(result).toEqual({ valid: false, code: "INVALID_QR" })
  })

  it("rejects fragments", () => {
    const result = parseQrCodeUrl(`${buildUserUrl()}#fragment`, config)

    expect(result).toEqual({ valid: false, code: "INVALID_ORIGIN" })
  })

  it("rejects oversized values", () => {
    const result = parseQrCodeUrl(
      `https://pokedex.example.com/${"a".repeat(MAX_QR_CODE_URL_LENGTH)}`,
      config
    )

    expect(result).toEqual({ valid: false, code: "INVALID_QR" })
  })
})
