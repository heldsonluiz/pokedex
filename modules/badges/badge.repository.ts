import "server-only"

import { createHash } from "node:crypto"

import { Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"

import {
  type Badge,
  badgeActivityTypeSchema,
  badgeFieldsSchema,
  type ParticipantBadge,
  participantBadgeFieldsSchema,
} from "./badge.schema"
import {
  collectCriterionRequirements,
  type CompletedActivities,
  type CompletedActivity,
  criterionMayChangeAfterActivity,
  matchesBadgeCriterion,
  matchesBadgeCriterionWithEvidence,
} from "./badge-evaluator"

const BADGES_COLLECTION = "badges"
const COMPLETIONS_COLLECTION = "activityCompletions"
const PARTICIPANT_BADGES_COLLECTION = "participantBadges"

const badgeDocumentSchema = badgeFieldsSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    createdAt: z.instanceof(Timestamp),
    updatedAt: z.instanceof(Timestamp),
  })

const participantBadgeDocumentSchema = participantBadgeFieldsSchema
  .omit({ id: true, awardedAt: true })
  .extend({ awardedAt: z.instanceof(Timestamp) })

const completionDocumentSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  activityType: badgeActivityTypeSchema,
  activityId: z.string().trim().min(1).max(128),
})

function getParticipantBadgeId(
  eventId: string,
  participantId: string,
  badgeId: string
) {
  return createHash("sha256")
    .update(JSON.stringify([eventId, participantId, badgeId]))
    .digest("hex")
}

function getCompletionId(
  eventId: string,
  participantId: string,
  activityType: z.infer<typeof badgeActivityTypeSchema>,
  activityId: string
) {
  return createHash("sha256")
    .update(JSON.stringify([eventId, participantId, activityType, activityId]))
    .digest("hex")
}

function parseBadge(id: string, value: unknown): Badge {
  const document = badgeDocumentSchema.parse(value)

  return badgeFieldsSchema.parse({
    id,
    ...document,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate(),
  })
}

function parseParticipantBadge(id: string, value: unknown): ParticipantBadge {
  const document = participantBadgeDocumentSchema.parse(value)

  return participantBadgeFieldsSchema.parse({
    id,
    ...document,
    awardedAt: document.awardedAt.toDate(),
  })
}

export async function findBadges(eventId: string): Promise<Badge[]> {
  const validatedEventId = badgeFieldsSchema.shape.eventId.parse(eventId)
  const snapshots = await firestore
    .collection(BADGES_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .get()

  return snapshots.docs
    .map((snapshot) => parseBadge(snapshot.id, snapshot.data()))
    .filter((badge) => badge.eventId === validatedEventId)
    .sort(
      (first, second) =>
        first.order - second.order ||
        first.name.localeCompare(second.name, "pt-BR")
    )
}

export async function findParticipantBadges(
  eventId: string,
  participantId: string
): Promise<ParticipantBadge[]> {
  const validatedEventId = badgeFieldsSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    participantBadgeFieldsSchema.shape.participantId.parse(participantId)
  const snapshots = await firestore
    .collection(PARTICIPANT_BADGES_COLLECTION)
    .where("participantId", "==", validatedParticipantId)
    .get()

  return snapshots.docs
    .map((snapshot) => parseParticipantBadge(snapshot.id, snapshot.data()))
    .filter(
      (badge) =>
        badge.eventId === validatedEventId &&
        badge.participantId === validatedParticipantId
    )
}

async function findCompletedActivities(
  eventId: string,
  participantId: string
): Promise<CompletedActivities> {
  const snapshots = await firestore
    .collection(COMPLETIONS_COLLECTION)
    .where("participantId", "==", participantId)
    .get()
  const completed = new Map<
    z.infer<typeof badgeActivityTypeSchema>,
    Set<string>
  >()

  for (const snapshot of snapshots.docs) {
    const result = completionDocumentSchema.safeParse(snapshot.data())

    if (
      !result.success ||
      result.data.eventId !== eventId ||
      result.data.participantId !== participantId
    ) {
      continue
    }

    const activityIds =
      completed.get(result.data.activityType) ?? new Set<string>()
    activityIds.add(result.data.activityId)
    completed.set(result.data.activityType, activityIds)
  }

  return completed
}

export async function awardEligibleBadges(
  eventId: string,
  participantId: string
): Promise<ParticipantBadge[]> {
  const validatedEventId = badgeFieldsSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    participantBadgeFieldsSchema.shape.participantId.parse(participantId)
  const [badges, participantBadges, completed] = await Promise.all([
    findBadges(validatedEventId),
    findParticipantBadges(validatedEventId, validatedParticipantId),
    findCompletedActivities(validatedEventId, validatedParticipantId),
  ])
  const awardedBadgeIds = new Set(
    participantBadges.map((badge) => badge.badgeId)
  )
  const eligibleBadges = badges.filter(
    (badge) =>
      badge.active &&
      !awardedBadgeIds.has(badge.id) &&
      matchesBadgeCriterion(badge.criterion, completed)
  )

  if (eligibleBadges.length === 0) {
    return []
  }

  return firestore.runTransaction(async (transaction) => {
    const references = eligibleBadges.map((badge) =>
      firestore
        .collection(PARTICIPANT_BADGES_COLLECTION)
        .doc(
          getParticipantBadgeId(
            validatedEventId,
            validatedParticipantId,
            badge.id
          )
        )
    )
    const snapshots = await Promise.all(
      references.map((reference) => transaction.get(reference))
    )
    const awardedAt = Timestamp.now()
    const awarded: ParticipantBadge[] = []

    eligibleBadges.forEach((badge, index) => {
      if (snapshots[index].exists) {
        return
      }

      const reference = references[index]
      transaction.create(reference, {
        eventId: validatedEventId,
        participantId: validatedParticipantId,
        badgeId: badge.id,
        awardedAt,
      })
      awarded.push(
        participantBadgeFieldsSchema.parse({
          id: reference.id,
          eventId: validatedEventId,
          participantId: validatedParticipantId,
          badgeId: badge.id,
          awardedAt: awardedAt.toDate(),
        })
      )
    })

    return awarded
  })
}

export async function awardEligibleBadgesAfterActivity(
  eventId: string,
  participantId: string,
  activity: CompletedActivity
): Promise<ParticipantBadge[]> {
  const validatedEventId = badgeFieldsSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    participantBadgeFieldsSchema.shape.participantId.parse(participantId)
  const validatedActivity = {
    type: badgeActivityTypeSchema.parse(activity.type),
    id: z.string().trim().min(1).max(128).parse(activity.id),
  }
  const badges = (await findBadges(validatedEventId)).filter(
    (badge) =>
      badge.active &&
      criterionMayChangeAfterActivity(badge.criterion, validatedActivity)
  )

  if (badges.length === 0) {
    return []
  }

  const badgeReferences = badges.map((badge) =>
    firestore
      .collection(PARTICIPANT_BADGES_COLLECTION)
      .doc(
        getParticipantBadgeId(
          validatedEventId,
          validatedParticipantId,
          badge.id
        )
      )
  )
  const badgeSnapshots = await firestore.getAll(...badgeReferences)
  const pendingBadges = badges.filter(
    (_badge, index) => !badgeSnapshots[index].exists
  )

  if (pendingBadges.length === 0) {
    return []
  }

  const requirements = pendingBadges.reduce(
    (result, badge) =>
      collectCriterionRequirements(
        badge.criterion,
        result.activityIds,
        result.countTypes
      ),
    {
      activityIds: new Set<string>(),
      countTypes: new Set<z.infer<typeof badgeActivityTypeSchema>>(),
    }
  )
  const activityRequirements = [...requirements.activityIds].map((key) => {
    const separator = key.indexOf(":")

    return {
      type: badgeActivityTypeSchema.parse(key.slice(0, separator)),
      id: key.slice(separator + 1),
    }
  })
  const completionReferences = activityRequirements.map((requirement) =>
    firestore
      .collection(COMPLETIONS_COLLECTION)
      .doc(
        getCompletionId(
          validatedEventId,
          validatedParticipantId,
          requirement.type,
          requirement.id
        )
      )
  )
  const [completionSnapshots, countResults] = await Promise.all([
    completionReferences.length > 0
      ? firestore.getAll(...completionReferences)
      : Promise.resolve([]),
    Promise.all(
      [...requirements.countTypes].map(async (activityType) => {
        const snapshot = await firestore
          .collection(COMPLETIONS_COLLECTION)
          .where("participantId", "==", validatedParticipantId)
          .where("eventId", "==", validatedEventId)
          .where("activityType", "==", activityType)
          .count()
          .get()

        return [activityType, snapshot.data().count] as const
      })
    ),
  ])
  const completedActivityIds = new Set(
    activityRequirements
      .filter((_requirement, index) => completionSnapshots[index].exists)
      .map((requirement) => `${requirement.type}:${requirement.id}`)
  )
  const completedCounts = new Map(countResults)
  const eligibleBadges = pendingBadges.filter((badge) =>
    matchesBadgeCriterionWithEvidence(badge.criterion, {
      completedActivityIds,
      completedCounts,
    })
  )

  if (eligibleBadges.length === 0) {
    return []
  }

  return firestore.runTransaction(async (transaction) => {
    const references = eligibleBadges.map((badge) =>
      firestore
        .collection(PARTICIPANT_BADGES_COLLECTION)
        .doc(
          getParticipantBadgeId(
            validatedEventId,
            validatedParticipantId,
            badge.id
          )
        )
    )
    const snapshots = await Promise.all(
      references.map((reference) => transaction.get(reference))
    )
    const awardedAt = Timestamp.now()
    const awarded: ParticipantBadge[] = []

    eligibleBadges.forEach((badge, index) => {
      if (snapshots[index].exists) {
        return
      }

      const reference = references[index]
      transaction.create(reference, {
        eventId: validatedEventId,
        participantId: validatedParticipantId,
        badgeId: badge.id,
        awardedAt,
      })
      awarded.push(
        participantBadgeFieldsSchema.parse({
          id: reference.id,
          eventId: validatedEventId,
          participantId: validatedParticipantId,
          badgeId: badge.id,
          awardedAt: awardedAt.toDate(),
        })
      )
    })

    return awarded
  })
}
