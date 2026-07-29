import type { BadgeActivityType, BadgeCriterion } from "./badge.schema"

export type CompletedActivities = ReadonlyMap<
  BadgeActivityType,
  ReadonlySet<string>
>

export type CompletedActivity = Readonly<{
  type: BadgeActivityType
  id: string
}>

export type ActivityEvidence = Readonly<{
  completedActivityIds: ReadonlySet<string>
  completedCounts: ReadonlyMap<BadgeActivityType, number>
}>

function getActivityKey(activityType: BadgeActivityType, activityId: string) {
  return `${activityType}:${activityId}`
}

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

export function criterionMayChangeAfterActivity(
  criterion: BadgeCriterion,
  activity: CompletedActivity
): boolean {
  switch (criterion.type) {
    case "activity":
      return (
        criterion.activityType === activity.type &&
        criterion.activityId === activity.id
      )
    case "activityCount":
      return criterion.activityType === activity.type
    case "allOf":
    case "anyOf":
      return criterion.criteria.some((item) =>
        criterionMayChangeAfterActivity(item, activity)
      )
  }
}

export function collectCriterionRequirements(
  criterion: BadgeCriterion,
  activityIds = new Set<string>(),
  countTypes = new Set<BadgeActivityType>()
) {
  switch (criterion.type) {
    case "activity":
      activityIds.add(
        getActivityKey(criterion.activityType, criterion.activityId)
      )
      break
    case "activityCount":
      countTypes.add(criterion.activityType)
      break
    case "allOf":
    case "anyOf":
      criterion.criteria.forEach((item) =>
        collectCriterionRequirements(item, activityIds, countTypes)
      )
      break
  }

  return { activityIds, countTypes }
}

export function matchesBadgeCriterionWithEvidence(
  criterion: BadgeCriterion,
  evidence: ActivityEvidence
): boolean {
  switch (criterion.type) {
    case "activity":
      return evidence.completedActivityIds.has(
        getActivityKey(criterion.activityType, criterion.activityId)
      )
    case "activityCount":
      return (
        (evidence.completedCounts.get(criterion.activityType) ?? 0) >=
        criterion.minimum
      )
    case "allOf":
      return criterion.criteria.every((item) =>
        matchesBadgeCriterionWithEvidence(item, evidence)
      )
    case "anyOf":
      return criterion.criteria.some((item) =>
        matchesBadgeCriterionWithEvidence(item, evidence)
      )
  }
}
