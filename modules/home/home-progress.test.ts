import { describe, expect, it } from "vitest"

import type { ParticipantSummary } from "@/modules/participant-summary/participant-summary.schema"

import { calculatePassportProgress, selectHomeObjective } from "./home-progress"

const baseSummary: ParticipantSummary = {
  eventId: "event",
  participantId: "participant",
  connectionsCount: 2,
  companiesVisitedCount: 1,
  tagsDiscoveredCount: 1,
  missionsCompletedCount: 1,
  initializedAt: new Date(0),
  updatedAt: new Date(0),
}

describe("home progress", () => {
  it("calculates passport progress from the lightweight counters", () => {
    expect(
      calculatePassportProgress(baseSummary, {
        companies: 4,
        missions: 3,
        tags: 3,
      })
    ).toEqual({ completed: 3, total: 10, percentage: 30 })
  })

  it("prioritizes incomplete companies without exceeding catalog totals", () => {
    expect(
      selectHomeObjective(baseSummary, {
        companies: 4,
        missions: 3,
        tags: 3,
      }).type
    ).toBe("company")
  })

  it("caps recorded completions when the active catalog becomes smaller", () => {
    expect(
      calculatePassportProgress(
        {
          ...baseSummary,
          companiesVisitedCount: 8,
          missionsCompletedCount: 4,
          tagsDiscoveredCount: 3,
        },
        { companies: 3, missions: 2, tags: 2 }
      )
    ).toEqual({ completed: 7, total: 7, percentage: 100 })
  })

  it("falls back to networking when the passport is complete", () => {
    expect(
      selectHomeObjective(
        {
          ...baseSummary,
          companiesVisitedCount: 4,
          missionsCompletedCount: 3,
          tagsDiscoveredCount: 3,
        },
        { companies: 4, missions: 3, tags: 3 }
      ).type
    ).toBe("connection")
  })
})
