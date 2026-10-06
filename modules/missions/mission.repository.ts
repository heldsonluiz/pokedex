import "server-only"

import { createHash } from "node:crypto"

import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { unstable_cache } from "next/cache"
import * as z from "zod"

import { CACHE_SECONDS, CACHE_TAGS } from "@/config/cache"
import { firestore } from "@/lib/firebase/admin"
import { getFirestoreCollectionName } from "@/lib/firebase/firestore-collection"
import {
  getParticipantSummaryRef,
  incrementParticipantSummary,
} from "@/modules/participant-summary/participant-summary.repository"
import { accessRolesSchema } from "@/modules/profile/profile.schema"

import {
  completeQrMissionInputSchema,
  type Mission,
  missionFieldsSchema,
} from "./mission.schema"
import {
  type MissionCompletion,
  missionCompletionFieldsSchema,
} from "./mission-completion.schema"
import { normalizeKeyword } from "./mission-keyword"
import { countSharedInterestConnections } from "./mission-networking"
import { scoreMissionQuiz } from "./mission-quiz"

const MISSIONS_COLLECTION = getFirestoreCollectionName("missions")
const COMPLETIONS_COLLECTION = getFirestoreCollectionName("activityCompletions")
const PROFILES_COLLECTION = getFirestoreCollectionName("profiles")

const missionDocumentSchema = z.object({
  eventId: missionFieldsSchema.shape.eventId,
  qrId: missionFieldsSchema.shape.qrId,
  title: missionFieldsSchema.shape.title,
  description: missionFieldsSchema.shape.description,
  imageUrl: missionFieldsSchema.shape.imageUrl,
  validationType: missionFieldsSchema.shape.validationType,
  quizConfig: missionFieldsSchema.shape.quizConfig,
  keywordConfig: missionFieldsSchema.shape.keywordConfig,
  progressRequirement: missionFieldsSchema.shape.progressRequirement,
  prerequisites: missionFieldsSchema.shape.prerequisites,
  active: missionFieldsSchema.shape.active,
  order: missionFieldsSchema.shape.order,
  xpAwarded: missionFieldsSchema.shape.xpAwarded,
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
})

const missionCompletionDocumentSchema = missionCompletionFieldsSchema
  .omit({ id: true, completedAt: true, validatedAt: true })
  .extend({
    completedAt: z.instanceof(Timestamp),
    validatedAt: z.instanceof(Timestamp).nullable(),
  })

const profileScoreSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  onboardingCompleted: z.boolean(),
  accessRoles: accessRolesSchema.default(["participant"]),
  xp: z.number().int().nonnegative().default(0),
})

export type CompleteMissionResult =
  | Readonly<{
      status: "completed" | "already-completed"
      mission: Mission
      completion: MissionCompletion
    }>
  | Readonly<{
      status:
        | "quiz-not-passed"
        | "invalid-answers"
        | "quiz-changed"
        | "incorrect-answer"
        | "attempts-exhausted"
        | "inactive"
        | "invalid-validation-type"
        | "not-found"
        | "prerequisite-missing"
        | "profile-unavailable"
    }>

type CachedMission = Omit<Mission, "createdAt" | "updatedAt"> &
  Readonly<{ createdAt: number; updatedAt: number }>

const automaticMissionSummarySchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  connectionsCount: z.number().int().nonnegative().default(0),
  companiesVisitedCount: z.number().int().nonnegative().default(0),
})

function getCompletionId(
  eventId: string,
  participantId: string,
  activityType: "company" | "mission",
  activityId: string
) {
  return createHash("sha256")
    .update(JSON.stringify([eventId, participantId, activityType, activityId]))
    .digest("hex")
}

function parseMissionDocument(id: string, value: unknown): Mission {
  const document = missionDocumentSchema.parse(value)

  return missionFieldsSchema.parse({
    id,
    ...document,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate(),
  })
}

function parseCompletion(id: string, value: unknown): MissionCompletion {
  const document = missionCompletionDocumentSchema.parse(value)

  return missionCompletionFieldsSchema.parse({
    id,
    ...document,
    completedAt: document.completedAt.toDate(),
    validatedAt: document.validatedAt?.toDate() ?? null,
  })
}

async function loadActiveMissions(eventId: string): Promise<CachedMission[]> {
  const validatedEventId =
    completeQrMissionInputSchema.shape.eventId.parse(eventId)
  const snapshots = await firestore
    .collection(MISSIONS_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .get()

  return snapshots.docs
    .map((snapshot) => parseMissionDocument(snapshot.id, snapshot.data()))
    .filter((mission) => mission.active)
    .sort(
      (first, second) =>
        first.order - second.order ||
        first.title.localeCompare(second.title, "pt-BR")
    )
    .map((mission) => ({
      ...mission,
      createdAt: mission.createdAt.getTime(),
      updatedAt: mission.updatedAt.getTime(),
    }))
}

const loadCachedActiveMissions = unstable_cache(
  loadActiveMissions,
  ["active-missions"],
  {
    revalidate: CACHE_SECONDS.EVENT_CATALOG,
    tags: [CACHE_TAGS.MISSIONS],
  }
)

export async function findActiveMissions(eventId: string): Promise<Mission[]> {
  const missions = await loadCachedActiveMissions(eventId)

  return missions.map((mission) => ({
    ...mission,
    createdAt: new Date(mission.createdAt),
    updatedAt: new Date(mission.updatedAt),
  }))
}

export async function findMissionProgressByParticipant(
  eventId: string,
  participantId: string
): Promise<{
  completions: MissionCompletion[]
  activityKeys: Set<string>
}> {
  const validatedEventId =
    completeQrMissionInputSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    profileScoreSchema.shape.userId.parse(participantId)
  const snapshots = await firestore
    .collection(COMPLETIONS_COLLECTION)
    .where("participantId", "==", validatedParticipantId)
    .get()
  const completions: MissionCompletion[] = []
  const activityKeys = new Set<string>()

  for (const snapshot of snapshots.docs) {
    const value = snapshot.data()
    const result = z
      .object({
        eventId: z.string(),
        participantId: z.string(),
        activityType: z.string(),
        activityId: z.string(),
      })
      .safeParse(value)

    if (
      !result.success ||
      result.data.eventId !== validatedEventId ||
      result.data.participantId !== validatedParticipantId
    ) {
      continue
    }

    activityKeys.add(`${result.data.activityType}:${result.data.activityId}`)

    if (result.data.activityType === "mission") {
      completions.push(parseCompletion(snapshot.id, value))
    }
  }

  return { completions, activityKeys }
}

async function findMissionTarget({
  eventId,
  missionId,
  qrId,
}: {
  eventId: string
  missionId?: string
  qrId?: string
}) {
  if (missionId) {
    const snapshot = await firestore
      .collection(MISSIONS_COLLECTION)
      .doc(missionId)
      .get()

    return snapshot.exists ? { id: snapshot.id, data: snapshot.data() } : null
  }

  const snapshots = await firestore
    .collection(MISSIONS_COLLECTION)
    .where("eventId", "==", eventId)
    .where("qrId", "==", qrId)
    .limit(2)
    .get()

  if (snapshots.size > 1) {
    throw new Error("Public mission QR identifier is not unique")
  }

  return snapshots.empty
    ? null
    : { id: snapshots.docs[0].id, data: snapshots.docs[0].data() }
}

export async function completeMission({
  eventId,
  participantId,
  validationType,
  defaultXpAwarded,
  missionId,
  qrId,
  validatedBy,
  answer,
  answers,
  revision,
}: {
  eventId: string
  participantId: string
  validationType: "qr" | "reviewer" | "keyword" | "quiz"
  defaultXpAwarded: number
  missionId?: string
  qrId?: string
  revision?: number
  answers?: Array<{ questionId: string; optionIndex: number }>
  answer?: string
  validatedBy?: string
}): Promise<CompleteMissionResult> {
  const validatedEventId =
    completeQrMissionInputSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    profileScoreSchema.shape.userId.parse(participantId)
  const validatedDefaultXp = z.number().int().positive().parse(defaultXpAwarded)
  const target = await findMissionTarget({
    eventId: validatedEventId,
    missionId,
    qrId,
  })

  if (!target) {
    return { status: "not-found" }
  }

  const mission = parseMissionDocument(target.id, target.data)

  if (mission.eventId !== validatedEventId) {
    return { status: "not-found" }
  }

  if (!mission.active) {
    return { status: "inactive" }
  }

  if (
    mission.validationType !== validationType ||
    (validationType === "qr" && mission.qrId !== qrId) ||
    (validationType === "reviewer" && !validatedBy)
  ) {
    return { status: "invalid-validation-type" }
  }

  const completionId = getCompletionId(
    validatedEventId,
    validatedParticipantId,
    "mission",
    mission.id
  )
  const profileRef = firestore
    .collection(PROFILES_COLLECTION)
    .doc(validatedParticipantId)
  const completionRef = firestore
    .collection(COMPLETIONS_COLLECTION)
    .doc(completionId)
  const attemptRef = firestore
    .collection(getFirestoreCollectionName("missionAttempts"))
    .doc(completionId)
  const prerequisiteRefs = mission.prerequisites.map((prerequisite) =>
    firestore
      .collection(COMPLETIONS_COLLECTION)
      .doc(
        getCompletionId(
          validatedEventId,
          validatedParticipantId,
          prerequisite.type,
          prerequisite.activityId
        )
      )
  )

  return firestore.runTransaction(async (transaction) => {
    const [
      profileSnapshot,
      completionSnapshot,
      attemptSnapshot,
      missionSnapshot,
      ...prerequisiteSnapshots
    ] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(completionRef),
      transaction.get(attemptRef),
      validationType === "quiz"
        ? transaction.get(
            firestore.collection(MISSIONS_COLLECTION).doc(mission.id)
          )
        : Promise.resolve(null),
      ...prerequisiteRefs.map((reference) => transaction.get(reference)),
    ])

    if (!profileSnapshot.exists) {
      return { status: "profile-unavailable" }
    }

    const profile = profileScoreSchema.parse(profileSnapshot.data())

    if (
      profile.userId !== validatedParticipantId ||
      profile.eventId !== validatedEventId ||
      !profile.onboardingCompleted ||
      !profile.accessRoles.includes("participant")
    ) {
      return { status: "profile-unavailable" }
    }

    if (completionSnapshot.exists) {
      return {
        status: "already-completed",
        mission,
        completion: parseCompletion(
          completionSnapshot.id,
          completionSnapshot.data()
        ),
      }
    }

    if (prerequisiteSnapshots.some((snapshot) => !snapshot.exists)) {
      return { status: "prerequisite-missing" }
    }

    if (validationType === "quiz") {
      if (!missionSnapshot?.exists) return { status: "not-found" }
      const currentMission = parseMissionDocument(
        missionSnapshot.id,
        missionSnapshot.data()
      )
      if (!currentMission.active) return { status: "inactive" }
      if (
        currentMission.validationType !== "quiz" ||
        !currentMission.quizConfig
      )
        return { status: "invalid-validation-type" }
      if (currentMission.eventId !== validatedEventId)
        return { status: "not-found" }
      if (
        currentMission.updatedAt.getTime() !== revision ||
        currentMission.updatedAt.getTime() !== mission.updatedAt.getTime()
      )
        return { status: "quiz-changed" }
      const config = currentMission.quizConfig!
      const attempts = z
        .number()
        .int()
        .nonnegative()
        .parse(attemptSnapshot.data()?.attempts ?? 0)
      if (attempts >= config.maxAttempts)
        return { status: "attempts-exhausted" }
      const score = scoreMissionQuiz(config, answers ?? [])
      if (score === null) return { status: "invalid-answers" }
      transaction.set(attemptRef, {
        eventId: validatedEventId,
        participantId: validatedParticipantId,
        missionId: mission.id,
        attempts: attempts + 1,
        updatedAt: Timestamp.now(),
      })
      if (score < config.minCorrectAnswers)
        return {
          status:
            attempts + 1 >= config.maxAttempts
              ? "attempts-exhausted"
              : "quiz-not-passed",
        }
    }

    if (validationType === "keyword") {
      const config = mission.keywordConfig!
      const attempts = z
        .number()
        .int()
        .nonnegative()
        .parse(attemptSnapshot.data()?.attempts ?? 0)
      if (attempts >= config.maxAttempts)
        return { status: "attempts-exhausted" }
      const correct = config.acceptedAnswers.some(
        (accepted) =>
          normalizeKeyword(accepted) === normalizeKeyword(answer ?? "")
      )
      transaction.set(attemptRef, {
        eventId: validatedEventId,
        participantId: validatedParticipantId,
        missionId: mission.id,
        attempts: attempts + 1,
        updatedAt: Timestamp.now(),
      })
      if (!correct)
        return {
          status:
            attempts + 1 >= config.maxAttempts
              ? "attempts-exhausted"
              : "incorrect-answer",
        }
    }

    const now = Timestamp.now()
    const xpAwarded = mission.xpAwarded ?? validatedDefaultXp
    const reviewerId = validationType === "reviewer" ? validatedBy! : null

    transaction.create(completionRef, {
      eventId: validatedEventId,
      participantId: validatedParticipantId,
      activityType: "mission",
      activityId: mission.id,
      qrId: mission.qrId,
      validationType,
      validatedBy: reviewerId,
      validatedAt: reviewerId ? now : null,
      xpAwarded,
      completedAt: now,
    })
    transaction.update(profileRef, {
      xp: profile.xp + xpAwarded,
      xpReachedAt: now,
      updatedAt: now,
    })
    incrementParticipantSummary(transaction, {
      eventId: validatedEventId,
      participantId: validatedParticipantId,
      counter: "missionsCompletedCount",
      amount: 1,
      now,
    })

    return {
      status: "completed",
      mission,
      completion: missionCompletionFieldsSchema.parse({
        id: completionId,
        eventId: validatedEventId,
        participantId: validatedParticipantId,
        activityType: "mission",
        activityId: mission.id,
        qrId: mission.qrId,
        validationType,
        validatedBy: reviewerId,
        validatedAt: reviewerId ? now.toDate() : null,
        xpAwarded,
        completedAt: now.toDate(),
      }),
    }
  })
}

export async function completeEligibleAutomaticMissions({
  eventId,
  participantId,
  missions,
  activeCompanyCount,
  defaultXpAwarded,
}: {
  eventId: string
  participantId: string
  missions: Mission[]
  activeCompanyCount: number
  defaultXpAwarded: number
}): Promise<number> {
  const validatedEventId =
    completeQrMissionInputSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    profileScoreSchema.shape.userId.parse(participantId)
  const validatedCompanyCount = z
    .number()
    .int()
    .nonnegative()
    .parse(activeCompanyCount)
  const validatedDefaultXp = z.number().int().positive().parse(defaultXpAwarded)
  const automaticMissions = missions.filter(
    (mission) =>
      mission.eventId === validatedEventId &&
      mission.active &&
      mission.validationType === "automatic"
  )

  if (automaticMissions.length === 0) return 0

  const profileRef = firestore
    .collection(PROFILES_COLLECTION)
    .doc(validatedParticipantId)
  const summaryRef = getParticipantSummaryRef(
    validatedEventId,
    validatedParticipantId
  )
  const completionRefs = automaticMissions.map((mission) =>
    firestore
      .collection(COMPLETIONS_COLLECTION)
      .doc(
        getCompletionId(
          validatedEventId,
          validatedParticipantId,
          "mission",
          mission.id
        )
      )
  )

  return firestore.runTransaction(async (transaction) => {
    const [profileSnapshot, summarySnapshot, ...completionSnapshots] =
      await Promise.all([
        transaction.get(profileRef),
        transaction.get(summaryRef),
        ...completionRefs.map((reference) => transaction.get(reference)),
      ])

    if (!profileSnapshot.exists || !summarySnapshot.exists) return 0

    const profile = profileScoreSchema.parse(profileSnapshot.data())
    const summary = automaticMissionSummarySchema.parse(summarySnapshot.data())

    if (
      profile.userId !== validatedParticipantId ||
      profile.eventId !== validatedEventId ||
      !profile.onboardingCompleted ||
      !profile.accessRoles.includes("participant") ||
      summary.eventId !== validatedEventId ||
      summary.participantId !== validatedParticipantId
    ) {
      return 0
    }

    const interestConnections = automaticMissions.some(
      (mission) => mission.progressRequirement?.type === "shared-interests"
    )
      ? await transaction.get(
          sharedInterestConnectionsQuery(validatedParticipantId)
        )
      : null
    const sharedInterestCount = interestConnections
      ? countSharedInterestConnections(
          validatedEventId,
          validatedParticipantId,
          interestConnections.docs.map((document) => document.data())
        )
      : 0

    const eligibleMissions = automaticMissions.filter((mission, index) => {
      if (completionSnapshots[index].exists || !mission.progressRequirement) {
        return false
      }

      const requirement = mission.progressRequirement
      const target =
        requirement.target === "all"
          ? validatedCompanyCount
          : requirement.target
      const current =
        requirement.type === "connections"
          ? summary.connectionsCount
          : requirement.type === "shared-interests"
            ? sharedInterestCount
            : summary.companiesVisitedCount

      return target > 0 && current >= target
    })

    if (eligibleMissions.length === 0) return 0

    const now = Timestamp.now()
    const totalXp = eligibleMissions.reduce(
      (sum, mission) => sum + (mission.xpAwarded ?? validatedDefaultXp),
      0
    )

    for (const mission of eligibleMissions) {
      const completionId = getCompletionId(
        validatedEventId,
        validatedParticipantId,
        "mission",
        mission.id
      )
      transaction.create(
        firestore.collection(COMPLETIONS_COLLECTION).doc(completionId),
        {
          eventId: validatedEventId,
          participantId: validatedParticipantId,
          activityType: "mission",
          activityId: mission.id,
          qrId: null,
          validationType: "automatic",
          validatedBy: null,
          validatedAt: null,
          xpAwarded: mission.xpAwarded ?? validatedDefaultXp,
          completedAt: now,
        }
      )
    }

    transaction.update(profileRef, {
      xp: profile.xp + totalXp,
      xpReachedAt: now,
      updatedAt: now,
    })
    transaction.set(
      summaryRef,
      {
        eventId: validatedEventId,
        participantId: validatedParticipantId,
        missionsCompletedCount: FieldValue.increment(eligibleMissions.length),
        updatedAt: now,
      },
      { merge: true }
    )

    return eligibleMissions.length
  })
}

function sharedInterestConnectionsQuery(participantId: string) {
  return firestore
    .collection(getFirestoreCollectionName("connections"))
    .where("participantIds", "array-contains", participantId)
}

export async function findSharedInterestConnectionCount(
  eventId: string,
  participantId: string
): Promise<number> {
  const snapshots = await sharedInterestConnectionsQuery(participantId).get()
  return countSharedInterestConnections(
    eventId,
    participantId,
    snapshots.docs.map((document) => document.data())
  )
}
