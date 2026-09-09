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

  it("prioritizes the collection closest to completion", () => {
    expect(
      selectHomeObjective(baseSummary, {
        companies: 4,
        missions: 3,
        tags: 3,
      }).type
    ).toBe("tag")
  })

  it("guides a participant with no connections to their first scan", () => {
    expect(
      selectHomeObjective(
        { ...baseSummary, connectionsCount: 0 },
        { companies: 4, missions: 3, tags: 3 }
      ).title
    ).toBe("Faça sua primeira conexão")
  })

  it("ignores empty and completed collections and avoids promising mission XP", () => {
    const objective = selectHomeObjective(baseSummary, {
      companies: 0,
      tags: 1,
      missions: 3,
    })
    expect(objective.type).toBe("mission")
    expect(objective.xpAwarded).toBeNull()
  })

  it("uses the remaining collection count for the next step", () => {
    const objective = selectHomeObjective(baseSummary, {
      companies: 2,
      tags: 4,
      missions: 3,
    })
    expect(objective.title).toBe("Falta visitar 1 empresa")
    expect(objective.href).toBe("/companies")
    expect(objective.xpAwarded).toBeNull()
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
