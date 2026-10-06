import { describe, expect, it } from "vitest"

import {
  interestsSchema,
  sharedInterests,
} from "@/modules/profile/profile-interests"

import { missionProgressRequirementSchema } from "./mission.schema"
import { countSharedInterestConnections } from "./mission-networking"

const connection = {
  eventId: "event-1",
  participantIds: ["user-1", "user-2"],
  status: "accepted",
  sharedInterests: ["ai", "cloud"],
}

describe("networking by interest", () => {
  it("counts people once even when they share several interests or have repeated records", () => {
    expect(
      countSharedInterestConnections("event-1", "user-1", [
        connection,
        connection,
        { ...connection, participantIds: ["user-3", "user-1"] },
      ])
    ).toBe(2)
  })
  it("ignores removed, pending, other-event, self and legacy connections", () => {
    expect(
      countSharedInterestConnections("event-1", "user-1", [
        { ...connection, status: "removed" },
        { ...connection, status: "pending" },
        { ...connection, eventId: "other" },
        { ...connection, participantIds: ["user-1", "user-1"] },
        { ...connection, sharedInterests: undefined },
        { ...connection, sharedInterests: [] },
        { ...connection, sharedInterests: ["unknown"] },
        { ...connection, participantIds: ["user-3", "user-2"] },
      ])
    ).toBe(0)
  })
  it("uses the recorded interests regardless of later profile changes", () => {
    expect(
      countSharedInterestConnections("event-1", "user-1", [connection])
    ).toBe(1)
    expect(sharedInterests([], [])).toEqual([])
  })
  it("snapshots only valid common interests without duplicates", () => {
    expect(
      sharedInterests(
        ["cloud", "ai", "ai", "unknown"],
        ["ai", "career", "unknown"]
      )
    ).toEqual(["ai"])
  })
  it("supports optional interests and rejects invalid or duplicate selections", () => {
    expect(interestsSchema.safeParse([]).success).toBe(true)
    expect(interestsSchema.safeParse(["ai", "ai"]).success).toBe(false)
    expect(interestsSchema.safeParse(["unknown"]).success).toBe(false)
    expect(
      interestsSchema.safeParse([
        "ai",
        "cloud",
        "web",
        "mobile",
        "data",
        "career",
      ]).success
    ).toBe(false)
  })
  it("requires a positive numeric target", () => {
    expect(
      missionProgressRequirementSchema.safeParse({
        type: "shared-interests",
        target: 3,
      }).success
    ).toBe(true)
    expect(
      missionProgressRequirementSchema.safeParse({
        type: "shared-interests",
        target: "all",
      }).success
    ).toBe(false)
    expect(
      missionProgressRequirementSchema.safeParse({
        type: "shared-interests",
        target: 0,
      }).success
    ).toBe(false)
  })
})
