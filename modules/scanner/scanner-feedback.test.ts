import { describe, expect, it } from "vitest"

import {
  classifyCameraError,
  getScannerFeedback,
  mapQrCodeError,
} from "./scanner-feedback"

describe("scanner feedback", () => {
  it.each([
    ["NotAllowedError", "permission-denied"],
    ["NotFoundError", "camera-unavailable"],
    ["NotReadableError", "camera-busy"],
    ["SecurityError", "insecure-context"],
  ] as const)("maps %s camera errors", (name, expected) => {
    expect(classifyCameraError(new DOMException("Camera error", name))).toBe(
      expected
    )
  })

  it("maps unknown camera errors", () => {
    expect(classifyCameraError(new Error("Unknown"))).toBe("unexpected")
  })

  it.each([
    ["INVALID_ORIGIN", "invalid-origin"],
    ["INVALID_EVENT", "invalid-event"],
    ["UNSUPPORTED_QR_TYPE", "unsupported-type"],
    ["INVALID_QR", "invalid-qr"],
    ["MISSING_TOKEN", "invalid-qr"],
  ] as const)("maps %s QR errors", (code, expected) => {
    expect(mapQrCodeError({ valid: false, code })).toBe(expected)
  })

  it("explains that an operations scan requires a participant QR", () => {
    expect(getScannerFeedback("target-unavailable").title).toBe(
      "Leia o QR Code de um participante"
    )
  })

  it("offers a safe retry after an unconfirmed operation", () => {
    expect(getScannerFeedback("validation-failed").description).toContain(
      "o XP não será duplicado"
    )
  })

  it("provides an actionable message for every scanner failure", () => {
    expect(getScannerFeedback("offline")).toEqual({
      title: "Sem conexão",
      description:
        "Conecte-se à internet para validar o QR Code e tente novamente.",
    })
  })
})
