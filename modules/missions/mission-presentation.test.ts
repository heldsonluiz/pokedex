import { describe, expect, it } from "vitest"

import type { MissionListItem } from "./mission.service"
import {
  orderMissionsForDisplay,
  selectFeaturedMission,
} from "./mission-presentation"

function mission(
  id: string,
  status: MissionListItem["status"]
): MissionListItem {
  return {
    id,
    title: id,
    description: `Descrição de ${id}`,
    imageUrl: null,
    validationType: "qr",
    status,
    xpAwarded: 50,
    completedAt: status === "completed" ? new Date(0) : null,
    blockedBy: [],
  }
}

describe("mission presentation", () => {
  it("keeps configured order inside statuses and moves completed items last", () => {
    const missions = [
      mission("blocked-1", "blocked"),
      mission("available-1", "available"),
      mission("completed-1", "completed"),
      mission("available-2", "available"),
      mission("blocked-2", "blocked"),
    ]

    expect(orderMissionsForDisplay(missions).map((item) => item.id)).toEqual([
      "available-1",
      "available-2",
      "blocked-1",
      "blocked-2",
      "completed-1",
    ])
  })

  it("does not feature failed missions and lists them after completed missions", () => {
    expect(selectFeaturedMission([mission("failed", "failed")])).toBeNull()
    expect(
      orderMissionsForDisplay([
        mission("failed", "failed"),
        mission("completed", "completed"),
      ]).map((item) => item.id)
    ).toEqual(["completed", "failed"])
  })

  it("features the first available mission", () => {
    expect(
      selectFeaturedMission([
        mission("blocked", "blocked"),
        mission("available", "available"),
      ])?.id
    ).toBe("available")
  })

  it("falls back to the first blocked mission", () => {
    expect(
      selectFeaturedMission([
        mission("completed", "completed"),
        mission("blocked", "blocked"),
      ])?.id
    ).toBe("blocked")
  })

  it("does not feature a mission when all are completed", () => {
    expect(
      selectFeaturedMission([mission("completed", "completed")])
    ).toBeNull()
  })
})
