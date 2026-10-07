import { describe, expect, it } from "vitest"

import type { TalkListItem } from "./talk.service"
import { getTalkEvaluationGroup } from "./talk-presentation"

describe("talk evaluation groups", () => {
  it("groups unanswered evaluations by their release state", () => {
    for (const evaluationStatus of ["open", "locked", "closed"] as const) {
      expect(getTalkEvaluationGroup({ evaluationStatus, rating: null })).toBe(
        evaluationStatus
      )
    }
  })
  it("keeps already rated talks in closed regardless of later release changes", () => {
    for (const evaluationStatus of ["open", "locked", "closed"] as const) {
      expect(
        getTalkEvaluationGroup({
          evaluationStatus,
          rating: {} as TalkListItem["rating"],
        })
      ).toBe("closed")
    }
  })
})
