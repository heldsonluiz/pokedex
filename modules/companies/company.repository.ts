import "server-only"

import { createHash } from "node:crypto"

import { Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"

import {
  type Company,
  companyFieldsSchema,
  visitCompanyInputSchema,
} from "./company.schema"
import {
  type CompanyVisit,
  companyVisitFieldsSchema,
} from "./company-visit.schema"

const COMPANIES_COLLECTION = "companies"
const COMPLETIONS_COLLECTION = "activityCompletions"
const PROFILES_COLLECTION = "profiles"

const companyDocumentSchema = z.object({
  ...companyFieldsSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }).shape,
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
})

const companyVisitDocumentSchema = companyVisitFieldsSchema
  .omit({
    id: true,
    completedAt: true,
  })
  .extend({
    completedAt: z.instanceof(Timestamp),
  })

const profileScoreSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  eventId: z.string().trim().min(1).max(128),
  onboardingCompleted: z.boolean(),
  xp: z.number().int().nonnegative().default(0),
})

export type CompleteCompanyVisitResult =
  | Readonly<{
      status: "visited" | "already-visited"
      company: Company
      visit: CompanyVisit
    }>
  | Readonly<{
      status: "not-found" | "inactive" | "profile-unavailable"
    }>

function getCompanyVisitId(
  eventId: string,
  participantId: string,
  companyId: string
) {
  return createHash("sha256")
    .update(JSON.stringify([eventId, participantId, "company", companyId]))
    .digest("hex")
}

function parseCompanyDocument(id: string, value: unknown): Company {
  const document = companyDocumentSchema.parse(value)

  return companyFieldsSchema.parse({
    id,
    ...document,
    createdAt: document.createdAt.toDate(),
    updatedAt: document.updatedAt.toDate(),
  })
}

function parseCompanyVisitDocument(id: string, value: unknown): CompanyVisit {
  const document = companyVisitDocumentSchema.parse(value)

  return companyVisitFieldsSchema.parse({
    id,
    ...document,
    completedAt: document.completedAt.toDate(),
  })
}

export async function findActiveCompanies(eventId: string): Promise<Company[]> {
  const validatedEventId = visitCompanyInputSchema.shape.eventId.parse(eventId)
  const snapshots = await firestore
    .collection(COMPANIES_COLLECTION)
    .where("eventId", "==", validatedEventId)
    .get()

  return snapshots.docs
    .map((snapshot) => parseCompanyDocument(snapshot.id, snapshot.data()))
    .filter((company) => company.active)
    .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"))
}

export async function findCompanyById(
  eventId: string,
  companyId: string
): Promise<Company | null> {
  const validatedEventId = visitCompanyInputSchema.shape.eventId.parse(eventId)
  const validatedCompanyId = companyFieldsSchema.shape.id.parse(companyId)
  const snapshot = await firestore
    .collection(COMPANIES_COLLECTION)
    .doc(validatedCompanyId)
    .get()

  if (!snapshot.exists) {
    return null
  }

  const company = parseCompanyDocument(snapshot.id, snapshot.data())

  if (company.eventId !== validatedEventId || !company.active) {
    return null
  }

  return company
}

export async function findCompanyVisitsByParticipant(
  eventId: string,
  participantId: string
): Promise<CompanyVisit[]> {
  const validatedEventId = visitCompanyInputSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    profileScoreSchema.shape.userId.parse(participantId)
  const snapshots = await firestore
    .collection(COMPLETIONS_COLLECTION)
    .where("participantId", "==", validatedParticipantId)
    .get()
  const visits: CompanyVisit[] = []

  for (const snapshot of snapshots.docs) {
    const value = snapshot.data()
    const activityType = z
      .object({ activityType: z.string() })
      .parse(value).activityType

    if (activityType !== "company") {
      continue
    }

    const visit = parseCompanyVisitDocument(snapshot.id, value)

    if (
      visit.eventId === validatedEventId &&
      visit.participantId === validatedParticipantId
    ) {
      visits.push(visit)
    }
  }

  return visits.sort(
    (first, second) =>
      second.completedAt.getTime() - first.completedAt.getTime()
  )
}

export async function findCompanyVisit(
  eventId: string,
  participantId: string,
  companyId: string
): Promise<CompanyVisit | null> {
  const validatedEventId = visitCompanyInputSchema.shape.eventId.parse(eventId)
  const validatedParticipantId =
    profileScoreSchema.shape.userId.parse(participantId)
  const validatedCompanyId = companyFieldsSchema.shape.id.parse(companyId)
  const visitId = getCompanyVisitId(
    validatedEventId,
    validatedParticipantId,
    validatedCompanyId
  )
  const snapshot = await firestore
    .collection(COMPLETIONS_COLLECTION)
    .doc(visitId)
    .get()

  if (!snapshot.exists) {
    return null
  }

  const visit = parseCompanyVisitDocument(snapshot.id, snapshot.data())

  if (
    visit.eventId !== validatedEventId ||
    visit.participantId !== validatedParticipantId ||
    visit.activityId !== validatedCompanyId
  ) {
    throw new Error("Stored company visit identity is invalid")
  }

  return visit
}

export async function completeCompanyVisit({
  eventId,
  qrId,
  participantId,
  defaultXpAwarded,
}: {
  eventId: string
  qrId: string
  participantId: string
  defaultXpAwarded: number
}): Promise<CompleteCompanyVisitResult> {
  const target = visitCompanyInputSchema.parse({ eventId, qrId })
  const validatedParticipantId =
    profileScoreSchema.shape.userId.parse(participantId)
  const validatedDefaultXp = z.number().int().positive().parse(defaultXpAwarded)
  const companyQuery = firestore
    .collection(COMPANIES_COLLECTION)
    .where("eventId", "==", target.eventId)
    .where("qrId", "==", target.qrId)
    .limit(2)
  const profileRef = firestore
    .collection(PROFILES_COLLECTION)
    .doc(validatedParticipantId)

  return firestore.runTransaction(async (transaction) => {
    const companySnapshots = await transaction.get(companyQuery)

    if (companySnapshots.empty) {
      return { status: "not-found" }
    }

    if (companySnapshots.size !== 1) {
      throw new Error("Public company QR identifier is not unique")
    }

    const companySnapshot = companySnapshots.docs[0]
    const company = parseCompanyDocument(
      companySnapshot.id,
      companySnapshot.data()
    )

    if (company.eventId !== target.eventId || company.qrId !== target.qrId) {
      throw new Error("Stored company identity is invalid")
    }

    if (!company.active) {
      return { status: "inactive" }
    }

    const visitId = getCompanyVisitId(
      target.eventId,
      validatedParticipantId,
      company.id
    )
    const visitRef = firestore.collection(COMPLETIONS_COLLECTION).doc(visitId)
    const [profileSnapshot, visitSnapshot] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(visitRef),
    ])

    if (!profileSnapshot.exists) {
      return { status: "profile-unavailable" }
    }

    const profile = profileScoreSchema.parse(profileSnapshot.data())

    if (
      profile.userId !== validatedParticipantId ||
      profile.eventId !== target.eventId ||
      !profile.onboardingCompleted
    ) {
      return { status: "profile-unavailable" }
    }

    if (visitSnapshot.exists) {
      const visit = parseCompanyVisitDocument(
        visitSnapshot.id,
        visitSnapshot.data()
      )

      if (
        visit.eventId !== target.eventId ||
        visit.participantId !== validatedParticipantId ||
        visit.activityId !== company.id
      ) {
        throw new Error("Stored company visit identity is invalid")
      }

      return {
        status: "already-visited",
        company,
        visit,
      }
    }

    const now = Timestamp.now()
    const xpAwarded = company.xpAwarded ?? validatedDefaultXp

    transaction.create(visitRef, {
      eventId: target.eventId,
      participantId: validatedParticipantId,
      activityType: "company",
      activityId: company.id,
      qrId: company.qrId,
      xpAwarded,
      completedAt: now,
    })
    transaction.update(profileRef, {
      xp: profile.xp + xpAwarded,
      xpReachedAt: now,
      updatedAt: now,
    })

    return {
      status: "visited",
      company,
      visit: companyVisitFieldsSchema.parse({
        id: visitId,
        eventId: target.eventId,
        participantId: validatedParticipantId,
        activityType: "company",
        activityId: company.id,
        qrId: company.qrId,
        xpAwarded,
        completedAt: now.toDate(),
      }),
    }
  })
}
