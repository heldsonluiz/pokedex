import { describe, expect, it } from "vitest"

import { hasExhaustedMissionAttempts } from "./mission-attempts"

describe("mission attempt lifecycle", () => {
  it("loads a legacy exhausted mission as failed after reopening", () => {
    expect(hasExhaustedMissionAttempts({ attempts: 2 }, 2)).toBe(true)
    expect(hasExhaustedMissionAttempts({ attempts: 1 }, 2)).toBe(false)
    expect(hasExhaustedMissionAttempts(undefined, 2)).toBe(false)
  })
  it("keeps a terminal failure even if the administrator increases the limit", () => {
    expect(
      hasExhaustedMissionAttempts({ attempts: 2, outcome: "failed" }, 10)
    ).toBe(true)
  })
})
