import type { MissionListItem } from "./mission.service"

const statusOrder = {
  available: 0,
  blocked: 1,
  completed: 2,
  failed: 3,
} as const

export function orderMissionsForDisplay(
  missions: readonly MissionListItem[]
): MissionListItem[] {
  return missions.toSorted(
    (first, second) => statusOrder[first.status] - statusOrder[second.status]
  )
}

export function selectFeaturedMission(
  missions: readonly MissionListItem[]
): MissionListItem | null {
  return (
    missions.find((mission) => mission.status === "available") ??
    missions.find((mission) => mission.status === "blocked") ??
    null
  )
}
