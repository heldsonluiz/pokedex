import "server-only"

import type { Session } from "next-auth"

import { SCORES } from "@/config/scores"
import { hasPermission } from "@/modules/profile/profile.authorization"
import { requireProfileForSession } from "@/modules/profile/profile.service"
import { findActiveSchedule } from "@/modules/schedule/schedule.repository"
import type {
  ScheduleEntry,
  ScheduleTrack,
} from "@/modules/schedule/schedule.schema"

import {
  completeTalkRating,
  findActiveTalkById,
  findActiveTalks,
  findTalkRatingsByParticipant,
  findVisibleSpeakers,
  updateTalkEvaluationStatus,
} from "./talk.repository"
import {
  type TalkEvaluationStatus,
  talkEvaluationStatusSchema,
  talkFieldsSchema,
  type TalkFormat,
} from "./talk.schema"
import type { SubmitTalkRatingInput, TalkRating } from "./talk-rating.schema"
import { submitTalkRatingInputSchema } from "./talk-rating.schema"

export type TalkSpeakerSummary = Readonly<{
  id: string
  name: string
  company: string | null
  title: string | null
  miniBio: string | null
  photoUrl: string | null
}>

export type TalkListItem = Readonly<{
  id: string
  title: string
  description: string
  category: string | null
  format: TalkFormat
  evaluationStatus: TalkEvaluationStatus
  speakers: TalkSpeakerSummary[]
  rating: TalkRating | null
  canEvaluate: boolean
  schedule: Readonly<{
    startAt: Date
    endAt: Date
    track: ScheduleTrack | null
    order: number | null
    activityType: Extract<ScheduleEntry["activity"], { talkId: string }>["type"]
  }>
}>

export type SubmitTalkRatingResult =
  | Readonly<{
      success: true
      code: "ALREADY_RATED" | "RATED"
      xpAwarded: number
    }>
  | Readonly<{
      success: false
      code:
        | "EVALUATION_CLOSED"
        | "EVALUATION_LOCKED"
        | "PROFILE_UNAVAILABLE"
        | "TALK_INACTIVE"
        | "TALK_NOT_FOUND"
    }>

function joinTalksWithSpeakers(
  talks: Awaited<ReturnType<typeof findActiveTalks>>,
  speakers: Awaited<ReturnType<typeof findVisibleSpeakers>>,
  ratings: TalkRating[],
  canEvaluate: boolean,
  schedule: Awaited<ReturnType<typeof findActiveSchedule>>
): TalkListItem[] {
  const speakersById = new Map(speakers.map((speaker) => [speaker.id, speaker]))
  const ratingsByTalkId = new Map(
    ratings.map((rating) => [rating.talkId, rating])
  )

  const scheduleByTalkId = new Map(
    schedule.flatMap((entry) =>
      "talkId" in entry.activity
        ? [[entry.activity.talkId, entry] as const]
        : []
    )
  )

  return talks.flatMap((talk) => {
    const scheduleEntry = scheduleByTalkId.get(talk.id)
    if (!scheduleEntry || !("talkId" in scheduleEntry.activity)) return []

    return [
      {
        id: talk.id,
        title: talk.title,
        description: talk.description,
        category: talk.category,
        format: talk.format,
        evaluationStatus: talk.evaluationStatus,
        speakers: talk.speakerIds.flatMap((speakerId) => {
          const speaker = speakersById.get(speakerId)

          return speaker
            ? [
                {
                  id: speaker.id,
                  name: speaker.name,
                  company: speaker.company,
                  title: speaker.title,
                  miniBio: speaker.miniBio,
                  photoUrl: speaker.photoUrl,
                },
              ]
            : []
        }),
        rating: ratingsByTalkId.get(talk.id) ?? null,
        canEvaluate,
        schedule: {
          startAt: scheduleEntry.startAt,
          endAt: scheduleEntry.endAt,
          track: scheduleEntry.track,
          order: scheduleEntry.order,
          activityType: scheduleEntry.activity.type,
        },
      },
    ]
  })
}

export async function listTalksForSession(
  session: Session
): Promise<TalkListItem[]> {
  const profile = await requireProfileForSession(session)
  const [talks, speakers, ratings, schedule] = await Promise.all([
    findActiveTalks(profile.eventId),
    findVisibleSpeakers(profile.eventId),
    profile.accessRoles.includes("participant")
      ? findTalkRatingsByParticipant(profile.eventId, profile.userId)
      : Promise.resolve([]),
    findActiveSchedule(profile.eventId),
  ])

  return joinTalksWithSpeakers(
    talks,
    speakers,
    ratings,
    profile.accessRoles.includes("participant"),
    schedule
  )
}

export async function getTalkDetailsForSession(
  session: Session,
  talkId: string
): Promise<TalkListItem | null> {
  const profile = await requireProfileForSession(session)
  const validatedTalkId = talkFieldsSchema.shape.id.parse(talkId)
  const [talk, speakers, ratings, schedule] = await Promise.all([
    findActiveTalkById(profile.eventId, validatedTalkId),
    findVisibleSpeakers(profile.eventId),
    profile.accessRoles.includes("participant")
      ? findTalkRatingsByParticipant(profile.eventId, profile.userId)
      : Promise.resolve([]),
    findActiveSchedule(profile.eventId),
  ])

  if (!talk) {
    return null
  }

  return (
    joinTalksWithSpeakers(
      [talk],
      speakers,
      ratings,
      profile.accessRoles.includes("participant"),
      schedule
    )[0] ?? null
  )
}

export async function listManageableTalksForSession(
  session: Session
): Promise<TalkListItem[] | null> {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "manage-event-operations")) {
    return null
  }

  const [talks, speakers, schedule] = await Promise.all([
    findActiveTalks(profile.eventId),
    findVisibleSpeakers(profile.eventId),
    findActiveSchedule(profile.eventId),
  ])

  return joinTalksWithSpeakers(talks, speakers, [], false, schedule)
}

export async function submitTalkRatingForSession(
  session: Session,
  input: SubmitTalkRatingInput
): Promise<SubmitTalkRatingResult> {
  const validatedInput = submitTalkRatingInputSchema.parse(input)
  const profile = await requireProfileForSession(session)
  const result = await completeTalkRating({
    eventId: profile.eventId,
    participantId: profile.userId,
    input: validatedInput,
    xpAwarded: SCORES.TALK_EVALUATION_COMPLETION,
  })

  switch (result.status) {
    case "rated":
      return {
        success: true,
        code: "RATED",
        xpAwarded: result.rating.xpAwarded,
      }
    case "already-rated":
      return {
        success: true,
        code: "ALREADY_RATED",
        xpAwarded: result.rating.xpAwarded,
      }
    case "closed":
      return { success: false, code: "EVALUATION_CLOSED" }
    case "locked":
      return { success: false, code: "EVALUATION_LOCKED" }
    case "inactive":
      return { success: false, code: "TALK_INACTIVE" }
    case "not-found":
      return { success: false, code: "TALK_NOT_FOUND" }
    case "profile-unavailable":
      return { success: false, code: "PROFILE_UNAVAILABLE" }
  }
}

export async function updateTalkEvaluationStatusForSession(
  session: Session,
  input: unknown
) {
  const validatedInput = talkFieldsSchema
    .pick({ id: true, evaluationStatus: true })
    .parse(input)
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "manage-event-operations")) {
    return { success: false as const, code: "FORBIDDEN" as const }
  }

  const result = await updateTalkEvaluationStatus(
    profile.eventId,
    validatedInput.id,
    talkEvaluationStatusSchema.parse(validatedInput.evaluationStatus)
  )

  return result === "updated"
    ? { success: true as const }
    : {
        success: false as const,
        code:
          result === "inactive"
            ? ("TALK_INACTIVE" as const)
            : ("TALK_NOT_FOUND" as const),
      }
}
