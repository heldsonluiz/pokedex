import "server-only"

import type { Session } from "next-auth"

import { SCORES } from "@/config/scores"
import { hasPermission } from "@/modules/profile/profile.authorization"
import { requireProfileForSession } from "@/modules/profile/profile.service"

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
  format: "talk" | "panel" | "keynote"
  evaluationStatus: TalkEvaluationStatus
  speakers: TalkSpeakerSummary[]
  rating: TalkRating | null
  canEvaluate: boolean
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
  canEvaluate: boolean
): TalkListItem[] {
  const speakersById = new Map(speakers.map((speaker) => [speaker.id, speaker]))
  const ratingsByTalkId = new Map(
    ratings.map((rating) => [rating.talkId, rating])
  )

  return talks.map((talk) => ({
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
  }))
}

export async function listTalksForSession(
  session: Session
): Promise<TalkListItem[]> {
  const profile = await requireProfileForSession(session)
  const [talks, speakers, ratings] = await Promise.all([
    findActiveTalks(profile.eventId),
    findVisibleSpeakers(profile.eventId),
    profile.accessRoles.includes("participant")
      ? findTalkRatingsByParticipant(profile.eventId, profile.userId)
      : Promise.resolve([]),
  ])

  return joinTalksWithSpeakers(
    talks,
    speakers,
    ratings,
    profile.accessRoles.includes("participant")
  )
}

export async function getTalkDetailsForSession(
  session: Session,
  talkId: string
): Promise<TalkListItem | null> {
  const profile = await requireProfileForSession(session)
  const validatedTalkId = talkFieldsSchema.shape.id.parse(talkId)
  const [talk, speakers, ratings] = await Promise.all([
    findActiveTalkById(profile.eventId, validatedTalkId),
    findVisibleSpeakers(profile.eventId),
    profile.accessRoles.includes("participant")
      ? findTalkRatingsByParticipant(profile.eventId, profile.userId)
      : Promise.resolve([]),
  ])

  if (!talk) {
    return null
  }

  return joinTalksWithSpeakers(
    [talk],
    speakers,
    ratings,
    profile.accessRoles.includes("participant")
  )[0]
}

export async function listManageableTalksForSession(
  session: Session
): Promise<TalkListItem[] | null> {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "manage-event-operations")) {
    return null
  }

  const [talks, speakers] = await Promise.all([
    findActiveTalks(profile.eventId),
    findVisibleSpeakers(profile.eventId),
  ])

  return joinTalksWithSpeakers(talks, speakers, [], false)
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
