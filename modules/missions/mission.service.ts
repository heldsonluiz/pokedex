import "server-only"

import type { Session } from "next-auth"

import { SCORES } from "@/config/scores"
import { env } from "@/env"
import { findActiveCompanies } from "@/modules/companies/company.repository"
import { hasPermission } from "@/modules/profile/profile.authorization"
import {
  getProfileByPublicQrId,
  requireProfileForSession,
} from "@/modules/profile/profile.service"
import { validateUserQrToken } from "@/modules/qr-code/user-qr-token"

import {
  completeMission,
  findActiveMissions,
  findCompletedActivityKeys,
  findMissionCompletionsByParticipant,
} from "./mission.repository"
import {
  completeQrMissionInputSchema,
  reviewMissionInputSchema,
} from "./mission.schema"

export type MissionListItem = Readonly<{
  id: string
  title: string
  description: string
  imageUrl: string | null
  validationType: "qr" | "reviewer"
  status: "available" | "blocked" | "completed"
  xpAwarded: number
  completedAt: Date | null
  blockedBy: ReadonlyArray<
    Readonly<{
      type: "company" | "mission"
      label: string
    }>
  >
}>

export type MissionOperationResult =
  | Readonly<{
      success: true
      code: "MISSION_COMPLETED" | "MISSION_ALREADY_COMPLETED"
      missionTitle: string
      participantName?: string
      xpAwarded: number
    }>
  | Readonly<{
      success: false
      code:
        | "FORBIDDEN"
        | "INVALID_EVENT"
        | "INVALID_QR"
        | "MISSION_INACTIVE"
        | "MISSION_NOT_FOUND"
        | "PREREQUISITE_MISSING"
        | "PROFILE_UNAVAILABLE"
        | "QR_EXPIRED"
        | "WRONG_VALIDATION_TYPE"
    }>

export async function listMissionsForSession(
  session: Session
): Promise<MissionListItem[]> {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "participate")) {
    return []
  }

  const [missions, companies, completions, activityKeys] = await Promise.all([
    findActiveMissions(profile.eventId),
    findActiveCompanies(profile.eventId),
    findMissionCompletionsByParticipant(profile.eventId, profile.userId),
    findCompletedActivityKeys(profile.eventId, profile.userId),
  ])
  const completionByMission = new Map(
    completions.map((completion) => [completion.activityId, completion])
  )
  const companyNames = new Map(
    companies.map((company) => [company.id, company.name])
  )
  const missionNames = new Map(
    missions.map((mission) => [mission.id, mission.title])
  )

  return missions.map((mission) => {
    const completion = completionByMission.get(mission.id)
    const blockedBy = mission.prerequisites
      .filter(
        (prerequisite) =>
          !activityKeys.has(`${prerequisite.type}:${prerequisite.activityId}`)
      )
      .map((prerequisite) => ({
        type: prerequisite.type,
        label:
          prerequisite.type === "company"
            ? (companyNames.get(prerequisite.activityId) ??
              "Visita a uma empresa")
            : (missionNames.get(prerequisite.activityId) ??
              "Conclusão de outra missão"),
      }))

    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      imageUrl: mission.imageUrl,
      validationType: mission.validationType,
      status: completion
        ? "completed"
        : blockedBy.length === 0
          ? "available"
          : "blocked",
      xpAwarded:
        completion?.xpAwarded ?? mission.xpAwarded ?? SCORES.MISSION_COMPLETION,
      completedAt: completion?.completedAt ?? null,
      blockedBy,
    }
  })
}

export async function listReviewableMissionsForSession(session: Session) {
  const reviewer = await requireProfileForSession(session)

  if (!hasPermission(reviewer, "review-missions")) {
    return null
  }

  const missions = await findActiveMissions(reviewer.eventId)

  return missions
    .filter((mission) => mission.validationType === "reviewer")
    .map((mission) => ({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      xpAwarded: mission.xpAwarded ?? SCORES.MISSION_COMPLETION,
    }))
}

export async function completeQrMissionForSession(
  session: Session,
  input: unknown
): Promise<MissionOperationResult> {
  const target = completeQrMissionInputSchema.parse(input)
  const participant = await requireProfileForSession(session)

  if (
    target.eventId !== env.EVENT_ID ||
    participant.eventId !== target.eventId
  ) {
    return { success: false, code: "INVALID_EVENT" }
  }

  if (!hasPermission(participant, "participate")) {
    return { success: false, code: "FORBIDDEN" }
  }

  const result = await completeMission({
    eventId: target.eventId,
    qrId: target.qrId,
    participantId: participant.userId,
    validationType: "qr",
    defaultXpAwarded: SCORES.MISSION_COMPLETION,
  })

  return mapCompletionResult(result)
}

export async function reviewMissionForSession(
  session: Session,
  input: unknown
): Promise<MissionOperationResult> {
  const target = reviewMissionInputSchema.parse(input)
  const reviewer = await requireProfileForSession(session)

  if (target.eventId !== env.EVENT_ID || reviewer.eventId !== target.eventId) {
    return { success: false, code: "INVALID_EVENT" }
  }

  if (!hasPermission(reviewer, "review-missions")) {
    return { success: false, code: "FORBIDDEN" }
  }

  const tokenResult = validateUserQrToken({
    token: target.token,
    eventId: target.eventId,
    qrId: target.participantQrId,
  })

  if (!tokenResult.valid) {
    return {
      success: false,
      code: tokenResult.code === "QR_EXPIRED" ? "QR_EXPIRED" : "INVALID_QR",
    }
  }

  const participant = await getProfileByPublicQrId(
    target.eventId,
    target.participantQrId
  )

  if (!participant?.onboardingCompleted) {
    return { success: false, code: "PROFILE_UNAVAILABLE" }
  }

  const result = await completeMission({
    eventId: target.eventId,
    missionId: target.missionId,
    participantId: participant.userId,
    validationType: "reviewer",
    validatedBy: reviewer.userId,
    defaultXpAwarded: SCORES.MISSION_COMPLETION,
  })

  const mapped = mapCompletionResult(result)

  return mapped.success
    ? { ...mapped, participantName: participant.displayName }
    : mapped
}

function mapCompletionResult(
  result: Awaited<ReturnType<typeof completeMission>>
): MissionOperationResult {
  switch (result.status) {
    case "completed":
      return {
        success: true,
        code: "MISSION_COMPLETED",
        missionTitle: result.mission.title,
        xpAwarded: result.completion.xpAwarded,
      }
    case "already-completed":
      return {
        success: true,
        code: "MISSION_ALREADY_COMPLETED",
        missionTitle: result.mission.title,
        xpAwarded: result.completion.xpAwarded,
      }
    case "inactive":
      return { success: false, code: "MISSION_INACTIVE" }
    case "invalid-validation-type":
      return { success: false, code: "WRONG_VALIDATION_TYPE" }
    case "not-found":
      return { success: false, code: "MISSION_NOT_FOUND" }
    case "prerequisite-missing":
      return { success: false, code: "PREREQUISITE_MISSING" }
    case "profile-unavailable":
      return { success: false, code: "PROFILE_UNAVAILABLE" }
  }
}
