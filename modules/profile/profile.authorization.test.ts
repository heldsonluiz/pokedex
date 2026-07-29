import { describe, expect, it } from "vitest"

import { hasPermission } from "./profile.authorization"

describe("profile authorization", () => {
  it("allows reviewers and admins to validate missions", () => {
    expect(
      hasPermission({ accessRoles: ["reviewer"] }, "review-missions")
    ).toBe(true)
    expect(hasPermission({ accessRoles: ["admin"] }, "review-missions")).toBe(
      true
    )
  })

  it("does not allow participants or generic staff to validate missions", () => {
    expect(
      hasPermission({ accessRoles: ["participant"] }, "review-missions")
    ).toBe(false)
    expect(hasPermission({ accessRoles: ["staff"] }, "review-missions")).toBe(
      false
    )
  })
})
