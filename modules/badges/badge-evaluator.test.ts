import { describe, expect, it } from "vitest"

import type { BadgeActivityType } from "./badge.schema"
import { matchesBadgeCriterion } from "./badge-evaluator"

const completed = new Map<BadgeActivityType, ReadonlySet<string>>([
  ["company", new Set(["company-1"])],
  ["tag", new Set(["tag-1", "tag-2"])],
  ["mission", new Set(["mission-1"])],
])

describe("badge evaluator", () => {
  it("matches a specific completed activity", () => {
    expect(
      matchesBadgeCriterion(
        {
          type: "activity",
          activityType: "mission",
          activityId: "mission-1",
        },
        completed
      )
    ).toBe(true)
  })

  it("matches a minimum activity count", () => {
    expect(
      matchesBadgeCriterion(
        { type: "activityCount", activityType: "tag", minimum: 2 },
        completed
      )
    ).toBe(true)
  })

  it("requires every nested criterion in an allOf rule", () => {
    expect(
      matchesBadgeCriterion(
        {
          type: "allOf",
          criteria: [
            {
              type: "activity",
              activityType: "company",
              activityId: "company-1",
            },
            {
              type: "activity",
              activityType: "mission",
              activityId: "mission-missing",
            },
          ],
        },
        completed
      )
    ).toBe(false)
  })

  it("requires at least one nested criterion in an anyOf rule", () => {
    expect(
      matchesBadgeCriterion(
        {
          type: "anyOf",
          criteria: [
            {
              type: "activity",
              activityType: "company",
              activityId: "company-missing",
            },
            { type: "activityCount", activityType: "tag", minimum: 2 },
          ],
        },
        completed
      )
    ).toBe(true)
  })
})
