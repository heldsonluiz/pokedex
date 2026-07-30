import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({ firestore: {} }))

import { calculateParticipantSummaryCounts } from "./participant-summary.repository"

describe("participant summary repository", () => {
  it("counts only the participant current-event activities and active connections", () => {
    const counts = calculateParticipantSummaryCounts({
      eventId: "event-1",
      participantId: "participant-1",
      completions: [
        completion("company"),
        completion("tag"),
        completion("mission"),
        completion("mission"),
        completion("company", "event-2"),
        { invalid: true },
      ],
      connections: [
        connection("accepted"),
        connection("removed"),
        connection("accepted", "event-2"),
      ],
    })

    expect(counts).toEqual({
      connectionsCount: 1,
      companiesVisitedCount: 1,
      tagsDiscoveredCount: 1,
      missionsCompletedCount: 2,
    })
  })
})

function completion(
  activityType: "company" | "tag" | "mission",
  eventId = "event-1"
) {
  return {
    eventId,
    participantId: "participant-1",
    activityType,
  }
}

function connection(status: "accepted" | "removed", eventId = "event-1") {
  return {
    eventId,
    participantIds: ["participant-1", "participant-2"],
    status,
  }
}
