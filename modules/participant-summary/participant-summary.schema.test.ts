import { describe, expect, it } from "vitest"

import { participantSummaryFieldsSchema } from "./participant-summary.schema"

describe("participant summary schema", () => {
  it("accepts a complete nonnegative summary", () => {
    const summary = participantSummaryFieldsSchema.parse({
      eventId: "event-1",
      participantId: "participant-1",
      connectionsCount: 12,
      companiesVisitedCount: 4,
      tagsDiscoveredCount: 3,
      missionsCompletedCount: 6,
      initializedAt: new Date("2026-07-29T12:00:00.000Z"),
      updatedAt: new Date("2026-07-29T12:30:00.000Z"),
    })

    expect(summary.connectionsCount).toBe(12)
  })

  it("rejects a negative counter", () => {
    const result = participantSummaryFieldsSchema.safeParse({
      eventId: "event-1",
      participantId: "participant-1",
      connectionsCount: -1,
      companiesVisitedCount: 0,
      tagsDiscoveredCount: 0,
      missionsCompletedCount: 0,
      initializedAt: new Date(),
      updatedAt: new Date(),
    })

    expect(result.success).toBe(false)
  })
})
