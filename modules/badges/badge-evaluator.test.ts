import { describe, expect, it } from "vitest"

import type { BadgeActivityType } from "./badge.schema"
import {
  collectCriterionRequirements,
  criterionMayChangeAfterActivity,
  matchesBadgeCriterion,
  matchesBadgeCriterionWithEvidence,
} from "./badge-evaluator"

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

  it("identifies criteria affected by the completed activity", () => {
    const criterion = {
      type: "allOf" as const,
      criteria: [
        {
          type: "activity" as const,
          activityType: "company" as const,
          activityId: "company-1",
        },
        {
          type: "activityCount" as const,
          activityType: "tag" as const,
          minimum: 2,
        },
      ],
    }

    expect(
      criterionMayChangeAfterActivity(criterion, {
        type: "company",
        id: "company-1",
      })
    ).toBe(true)
    expect(
      criterionMayChangeAfterActivity(criterion, {
        type: "company",
        id: "company-2",
      })
    ).toBe(false)
    expect(
      criterionMayChangeAfterActivity(criterion, {
        type: "tag",
        id: "tag-3",
      })
    ).toBe(true)
  })

  it("collects only the evidence required by a composite criterion", () => {
    const result = collectCriterionRequirements({
      type: "allOf",
      criteria: [
        {
          type: "activity",
          activityType: "company",
          activityId: "company-1",
        },
        { type: "activityCount", activityType: "tag", minimum: 2 },
      ],
    })

    expect([...result.activityIds]).toEqual(["company:company-1"])
    expect([...result.countTypes]).toEqual(["tag"])
  })

  it("evaluates a criterion from direct activity and count evidence", () => {
    expect(
      matchesBadgeCriterionWithEvidence(
        {
          type: "allOf",
          criteria: [
            {
              type: "activity",
              activityType: "company",
              activityId: "company-1",
            },
            { type: "activityCount", activityType: "tag", minimum: 2 },
          ],
        },
        {
          completedActivityIds: new Set(["company:company-1"]),
          completedCounts: new Map([["tag", 2]]),
        }
      )
    ).toBe(true)
  })
})
