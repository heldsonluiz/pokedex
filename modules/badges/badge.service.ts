import "server-only"

import type { Session } from "next-auth"

import { hasPermission } from "@/modules/profile/profile.authorization"
import { requireProfileForSession } from "@/modules/profile/profile.service"

import {
  awardEligibleBadges,
  findBadges,
  findParticipantBadges,
} from "./badge.repository"
import type { BadgeCriterion } from "./badge.schema"

export type BadgeCollectionItem =
  | Readonly<{
      status: "earned"
      id: string
      name: string
      description: string
      imageUrl: string
      earnedAt: Date
    }>
  | Readonly<{
      status: "locked"
      id: string
      name: string
      description: string
      imageUrl: string
      criterionLabel: string
    }>
  | Readonly<{
      status: "secret"
      id: string
    }>

export type BadgeCollection =
  | Readonly<{ available: false }>
  | Readonly<{
      available: true
      earnedCount: number
      totalCount: number
      items: BadgeCollectionItem[]
    }>

const activityLabels = {
  company: { singular: "empresa", plural: "empresas" },
  tag: { singular: "tag", plural: "tags" },
  mission: { singular: "missão", plural: "missões" },
} as const

export function formatBadgeCriterion(criterion: BadgeCriterion): string {
  switch (criterion.type) {
    case "activity":
      return `Conclua a ${activityLabels[criterion.activityType].singular} indicada`
    case "activityCount":
      return `Conclua ${criterion.minimum} ${activityLabels[criterion.activityType].plural}`
    case "allOf":
      return criterion.criteria.map(formatBadgeCriterion).join(" e ")
    case "anyOf":
      return criterion.criteria.map(formatBadgeCriterion).join(" ou ")
  }
}

export async function evaluateParticipantBadges(
  eventId: string,
  participantId: string
) {
  try {
    return await awardEligibleBadges(eventId, participantId)
  } catch (error) {
    console.error("Failed to evaluate participant badges", {
      eventId,
      participantId,
      error,
    })

    return []
  }
}

export async function getBadgeProgress(eventId: string, participantId: string) {
  const [badges, participantBadges] = await Promise.all([
    findBadges(eventId),
    findParticipantBadges(eventId, participantId),
  ])
  const earnedBadgeIds = new Set(
    participantBadges.map((badge) => badge.badgeId)
  )
  const visibleBadges = badges.filter(
    (badge) => badge.active || earnedBadgeIds.has(badge.id)
  )

  return {
    earnedCount: visibleBadges.filter((badge) => earnedBadgeIds.has(badge.id))
      .length,
    totalCount: visibleBadges.length,
  }
}

export async function getBadgesForSession(
  session: Session
): Promise<BadgeCollection> {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "participate")) {
    return { available: false }
  }

  await awardEligibleBadges(profile.eventId, profile.userId)

  const [badges, participantBadges] = await Promise.all([
    findBadges(profile.eventId),
    findParticipantBadges(profile.eventId, profile.userId),
  ])
  const earnedByBadgeId = new Map(
    participantBadges.map((badge) => [badge.badgeId, badge])
  )
  const visibleBadges = badges.filter(
    (badge) => badge.active || earnedByBadgeId.has(badge.id)
  )
  const items: BadgeCollectionItem[] = visibleBadges.map((badge) => {
    const earned = earnedByBadgeId.get(badge.id)

    if (earned) {
      return {
        status: "earned",
        id: badge.id,
        name: badge.name,
        description: badge.description,
        imageUrl: badge.imageUrl,
        earnedAt: earned.awardedAt,
      }
    }

    if (badge.visibility === "secret") {
      return { status: "secret", id: badge.id }
    }

    return {
      status: "locked",
      id: badge.id,
      name: badge.name,
      description: badge.description,
      imageUrl: badge.imageUrl,
      criterionLabel: formatBadgeCriterion(badge.criterion),
    }
  })

  return {
    available: true,
    earnedCount: items.filter((item) => item.status === "earned").length,
    totalCount: items.length,
    items,
  }
}
