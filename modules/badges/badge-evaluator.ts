import type { BadgeActivityType, BadgeCriterion } from "./badge.schema"

export type CompletedActivities = ReadonlyMap<
  BadgeActivityType,
  ReadonlySet<string>
>

export function matchesBadgeCriterion(
  criterion: BadgeCriterion,
  completed: CompletedActivities
): boolean {
  switch (criterion.type) {
    case "activity":
      return (
        completed.get(criterion.activityType)?.has(criterion.activityId) ??
        false
      )
    case "activityCount":
      return (
        (completed.get(criterion.activityType)?.size ?? 0) >= criterion.minimum
      )
    case "allOf":
      return criterion.criteria.every((item) =>
        matchesBadgeCriterion(item, completed)
      )
    case "anyOf":
      return criterion.criteria.some((item) =>
        matchesBadgeCriterion(item, completed)
      )
  }
}
