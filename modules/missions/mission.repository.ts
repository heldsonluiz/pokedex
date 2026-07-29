import "server-only"

import { createHash } from "node:crypto"

import { Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"
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

const MISSIONS_COLLECTION = "missions"
const COMPLETIONS_COLLECTION = "activityCompletions"
const PROFILES_COLLECTION = "profiles"

const missionDocumentSchema = z.object({
  eventId: missionFieldsSchema.shape.eventId,
  qrId: missionFieldsSchema.shape.qrId,
  title: missionFieldsSchema.shape.title,
  description: missionFieldsSchema.shape.description,
  imageUrl: missionFieldsSchema.shape.imageUrl,
  validationType: missionFieldsSchema.shape.validationType,
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
        | "inactive"
        | "invalid-validation-type"
        | "not-found"
        | "prerequisite-missing"
        | "profile-unavailable"
    }>

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

export async function findActiveMissions(eventId: string): Promise<Mission[]> {
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
}

export async function findMissionCompletionsByParticipant(
  eventId: string,
  participantId: string
): Promise<MissionCompletion[]> {
  const validatedEventId =
    completeQrMissionInputSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    profileScoreSchema.shape.userId.parse(participantId)
  const snapshots = await firestore
    .collection(COMPLETIONS_COLLECTION)
    .where("participantId", "==", validatedParticipantId)
    .get()
  const completions: MissionCompletion[] = []

  for (const snapshot of snapshots.docs) {
    const value = snapshot.data()
    const type = z
      .object({ activityType: z.string() })
      .parse(value).activityType

    if (type !== "mission") {
      continue
    }

    const completion = parseCompletion(snapshot.id, value)

    if (completion.eventId === validatedEventId) {
      completions.push(completion)
    }
  }

  return completions
}

export async function findCompletedActivityKeys(
  eventId: string,
  participantId: string
): Promise<Set<string>> {
  const validatedEventId =
    completeQrMissionInputSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    profileScoreSchema.shape.userId.parse(participantId)
  const snapshots = await firestore
    .collection(COMPLETIONS_COLLECTION)
    .where("participantId", "==", validatedParticipantId)
    .get()
  const keys = new Set<string>()

  for (const snapshot of snapshots.docs) {
    const result = z
      .object({
        eventId: z.string(),
        participantId: z.string(),
        activityType: z.string(),
        activityId: z.string(),
      })
      .safeParse(snapshot.data())

    if (
      result.success &&
      result.data.eventId === validatedEventId &&
      result.data.participantId === validatedParticipantId
    ) {
      keys.add(`${result.data.activityType}:${result.data.activityId}`)
    }
  }

  return keys
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
}: {
  eventId: string
  participantId: string
  validationType: "qr" | "reviewer"
  defaultXpAwarded: number
  missionId?: string
  qrId?: string
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
    const [profileSnapshot, completionSnapshot, ...prerequisiteSnapshots] =
      await Promise.all([
        transaction.get(profileRef),
        transaction.get(completionRef),
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
