import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/env", () => ({
  env: {
    QR_SIGNING_SECRET: "test-signing-secret-with-at-least-32-characters",
  },
}))

import { createUserQrToken, validateUserQrToken } from "./user-qr-token"

const EVENT_ID = "devfest-2026"
const QR_ID = "123e4567-e89b-42d3-a456-426614174000"
const ANOTHER_QR_ID = "123e4567-e89b-42d3-a456-426614174001"
const NOW = new Date("2026-07-28T12:00:00.000Z")

describe("participant QR Code token", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("accepts a valid signed token", () => {
    const { token } = createUserQrToken({
      eventId: EVENT_ID,
      qrId: QR_ID,
      now: NOW,
    })

    expect(
      validateUserQrToken({
        token,
        eventId: EVENT_ID,
        qrId: QR_ID,
        now: NOW,
      })
    ).toMatchObject({
      valid: true,
      payload: {
        version: 3,
        eventId: EVENT_ID,
        type: "user",
        qrId: QR_ID,
      },
    })
  })

  it("rejects an altered signature", () => {
    const { token } = createUserQrToken({
      eventId: EVENT_ID,
      qrId: QR_ID,
      now: NOW,
    })
    const decodedToken = Buffer.from(token, "base64url")
    decodedToken[decodedToken.length - 1] ^= 1
    const alteredToken = decodedToken.toString("base64url")

    expect(
      validateUserQrToken({
        token: alteredToken,
        eventId: EVENT_ID,
        qrId: QR_ID,
        now: NOW,
      })
    ).toEqual({ valid: false, code: "INVALID_QR" })
  })

  it("rejects an altered payload", () => {
    const { token } = createUserQrToken({
      eventId: EVENT_ID,
      qrId: QR_ID,
      now: NOW,
    })
    const decodedToken = Buffer.from(token, "base64url")
    decodedToken[1] ^= 1
    const alteredToken = decodedToken.toString("base64url")

    expect(
      validateUserQrToken({
        token: alteredToken,
        eventId: EVENT_ID,
        qrId: QR_ID,
        now: NOW,
      })
    ).toEqual({ valid: false, code: "INVALID_QR" })
  })

  it("rejects an expired token", () => {
    const { token } = createUserQrToken({
      eventId: EVENT_ID,
      qrId: QR_ID,
      now: NOW,
    })

    expect(
      validateUserQrToken({
        token,
        eventId: EVENT_ID,
        qrId: QR_ID,
        now: new Date(NOW.getTime() + 66_000),
      })
    ).toEqual({ valid: false, code: "QR_EXPIRED" })
  })

  it("rejects a token issued beyond the clock tolerance", () => {
    const { token } = createUserQrToken({
      eventId: EVENT_ID,
      qrId: QR_ID,
      now: new Date(NOW.getTime() + 6_000),
    })

    expect(
      validateUserQrToken({
        token,
        eventId: EVENT_ID,
        qrId: QR_ID,
        now: NOW,
      })
    ).toEqual({ valid: false, code: "INVALID_QR" })
  })

  it("binds the signature to the event and QR identifier in the URL", () => {
    const { token } = createUserQrToken({
      eventId: EVENT_ID,
      qrId: QR_ID,
      now: NOW,
    })

    expect(
      validateUserQrToken({
        token,
        eventId: "another-event",
        qrId: QR_ID,
        now: NOW,
      })
    ).toEqual({ valid: false, code: "INVALID_QR" })

    expect(
      validateUserQrToken({
        token,
        eventId: EVENT_ID,
        qrId: ANOTHER_QR_ID,
        now: NOW,
      })
    ).toEqual({ valid: false, code: "INVALID_QR" })
  })

  it("keeps the temporary token compact", () => {
    const { token } = createUserQrToken({
      eventId: EVENT_ID,
      qrId: QR_ID,
      now: NOW,
    })

    expect(token).toHaveLength(44)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it.each(["short-token", `${"a".repeat(43)}!`])(
    "rejects malformed binary token %s",
    (token) => {
      expect(
        validateUserQrToken({
          token,
          eventId: EVENT_ID,
          qrId: QR_ID,
          now: NOW,
        })
      ).toEqual({ valid: false, code: "INVALID_QR" })
    }
  )
})
