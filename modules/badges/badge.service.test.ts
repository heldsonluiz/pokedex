import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/modules/profile/profile.service", () => ({}))
vi.mock("./badge.repository", () => ({}))

import { formatBadgeCriterion } from "./badge.service"

describe("badge service", () => {
  it("describes count criteria", () => {
    expect(
      formatBadgeCriterion({
        type: "activityCount",
        activityType: "mission",
        minimum: 5,
      })
    ).toBe("Conclua 5 missões")
  })

  it("joins composite criteria", () => {
    expect(
      formatBadgeCriterion({
        type: "allOf",
        criteria: [
          { type: "activityCount", activityType: "company", minimum: 3 },
          { type: "activityCount", activityType: "tag", minimum: 2 },
        ],
      })
    ).toBe("Conclua 3 empresas e Conclua 2 tags")
  })
})
