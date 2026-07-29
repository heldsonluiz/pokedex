import "server-only"

import type { Session } from "next-auth"

import { SCORES } from "@/config/scores"
import { findActiveCompanies } from "@/modules/companies/company.repository"
import { findActiveMissions } from "@/modules/missions/mission.repository"
import { hasPermission } from "@/modules/profile/profile.authorization"
import { requireProfileForSession } from "@/modules/profile/profile.service"
import { findActiveTags } from "@/modules/tags/tag.repository"

import { findPassportCompletions } from "./passport.repository"

export type PassportCompanyItem = Readonly<{
  id: string
  name: string
  logoUrl: string
  stampImageUrl: string
  xpAwarded: number
  visitedAt: Date | null
}>

export type PassportTagItem =
  | Readonly<{ status: "locked"; slot: number }>
  | Readonly<{
      status: "discovered"
      slot: number
      name: string
      imageUrl: string
      xpAwarded: number
      discoveredAt: Date
    }>

export type PassportMissionItem = Readonly<{
  id: string
  title: string
  imageUrl: string | null
  status: "available" | "completed"
  xpAwarded: number
  completedAt: Date | null
}>

export type PassportAchievement = Readonly<{
  key: string
  type: "company" | "tag" | "mission"
  label: string
  imageUrl: string | null
  xpAwarded: number
  completedAt: Date
}>

export type ParticipantPassport = Readonly<{
  available: true
  completedCount: number
  totalCount: number
  xpEarned: number
  companies: Readonly<{
    completedCount: number
    totalCount: number
    items: PassportCompanyItem[]
  }>
  tags: Readonly<{
    discoveredCount: number
    totalCount: number
    items: PassportTagItem[]
  }>
  missions: Readonly<{
    completedCount: number
    totalCount: number
    items: PassportMissionItem[]
  }>
  recentAchievements: PassportAchievement[]
}>

export type Passport =
  | ParticipantPassport
  | Readonly<{
      available: false
    }>

export function buildParticipantPassport({
  companies,
  tags,
  missions,
}: {
  companies: PassportCompanyItem[]
  tags: ParticipantPassport["tags"]
  missions: PassportMissionItem[]
}): ParticipantPassport {
  const visitedCompanies = companies.filter(
    (company) => company.visitedAt !== null
  )
  const discoveredTags = tags.items.filter((tag) => tag.status === "discovered")
  const completedMissions = missions.filter(
    (mission) => mission.status === "completed"
  )
  const recentAchievements: PassportAchievement[] = [
    ...visitedCompanies.map((company) => ({
      key: `company:${company.id}`,
      type: "company" as const,
      label: company.name,
      imageUrl: company.stampImageUrl,
      xpAwarded: company.xpAwarded,
      completedAt: company.visitedAt!,
    })),
    ...discoveredTags.map((tag) => ({
      key: `tag:${tag.slot}`,
      type: "tag" as const,
      label: tag.name,
      imageUrl: tag.imageUrl,
      xpAwarded: tag.xpAwarded,
      completedAt: tag.discoveredAt,
    })),
    ...completedMissions.map((mission) => ({
      key: `mission:${mission.id}`,
      type: "mission" as const,
      label: mission.title,
      imageUrl: mission.imageUrl,
      xpAwarded: mission.xpAwarded,
      completedAt: mission.completedAt!,
    })),
  ].sort(
    (first, second) =>
      second.completedAt.getTime() - first.completedAt.getTime()
  )
  const completedCount =
    visitedCompanies.length + discoveredTags.length + completedMissions.length
  const totalCount = companies.length + tags.totalCount + missions.length

  return {
    available: true,
    completedCount,
    totalCount,
    xpEarned: recentAchievements.reduce(
      (total, achievement) => total + achievement.xpAwarded,
      0
    ),
    companies: {
      completedCount: visitedCompanies.length,
      totalCount: companies.length,
      items: companies,
    },
    tags,
    missions: {
      completedCount: completedMissions.length,
      totalCount: missions.length,
      items: missions,
    },
    recentAchievements: recentAchievements.slice(0, 5),
  }
}

export async function getPassportForSession(
  session: Session
): Promise<Passport> {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "participate")) {
    return { available: false }
  }

  const [companies, tags, missions, completions] = await Promise.all([
    findActiveCompanies(profile.eventId),
    findActiveTags(profile.eventId),
    findActiveMissions(profile.eventId),
    findPassportCompletions(profile.eventId, profile.userId),
  ])
  const completionByActivity = new Map(
    completions.map((completion) => [
      `${completion.activityType}:${completion.activityId}`,
      completion,
    ])
  )
  const companyItems: PassportCompanyItem[] = companies.map((company) => {
    const completion = completionByActivity.get(`company:${company.id}`)

    return {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      stampImageUrl: company.stampImageUrl ?? company.logoUrl,
      xpAwarded:
        completion?.xpAwarded ?? company.xpAwarded ?? SCORES.COMPANY_VISIT,
      visitedAt: completion?.completedAt ?? null,
    }
  })
  const tagItems: PassportTagItem[] = tags.map((tag, index) => {
    const completion = completionByActivity.get(`tag:${tag.id}`)
    const slot = index + 1

    return completion
      ? {
          status: "discovered",
          slot,
          name: tag.name,
          imageUrl: tag.imageUrl,
          xpAwarded: completion.xpAwarded,
          discoveredAt: completion.completedAt,
        }
      : { status: "locked", slot }
  })
  const missionItems: PassportMissionItem[] = missions.map((mission) => {
    const completion = completionByActivity.get(`mission:${mission.id}`)

    return {
      id: mission.id,
      title: mission.title,
      imageUrl: mission.imageUrl,
      status: completion ? "completed" : "available",
      xpAwarded:
        completion?.xpAwarded ?? mission.xpAwarded ?? SCORES.MISSION_COMPLETION,
      completedAt: completion?.completedAt ?? null,
    }
  })

  return buildParticipantPassport({
    companies: companyItems,
    tags: {
      discoveredCount: tagItems.filter((tag) => tag.status === "discovered")
        .length,
      totalCount: tagItems.length,
      items: tagItems,
    },
    missions: missionItems,
  })
}
