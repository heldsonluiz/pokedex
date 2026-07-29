import "server-only"

import type { Session } from "next-auth"

import { SCORES } from "@/config/scores"
import { env } from "@/env"
import { evaluateParticipantBadges } from "@/modules/badges/badge.service"
import { requireProfileForSession } from "@/modules/profile/profile.service"

import {
  completeCompanyVisit,
  findActiveCompanies,
  findCompanyById,
  findCompanyVisit,
  findCompanyVisitsByParticipant,
} from "./company.repository"
import {
  type Company,
  companyFieldsSchema,
  visitCompanyInputSchema,
} from "./company.schema"

export type CompanyVisitOperationResult =
  | Readonly<{
      success: true
      code: "COMPANY_VISITED" | "COMPANY_ALREADY_VISITED"
      companyName: string
      xpAwarded: number
    }>
  | Readonly<{
      success: false
      code:
        | "COMPANY_INACTIVE"
        | "COMPANY_NOT_FOUND"
        | "INVALID_EVENT"
        | "PROFILE_INCOMPLETE"
    }>

export type CompanyListItem = Readonly<{
  id: string
  name: string
  description: string | null
  logoUrl: string
  stampImageUrl: string
  xpAwarded: number
  visitedAt: Date | null
}>

export type CompanyDetails = CompanyListItem

function toCompanyListItem(
  company: Company,
  visitedAt: Date | null
): CompanyListItem {
  return {
    id: company.id,
    name: company.name,
    description: company.description,
    logoUrl: company.logoUrl,
    stampImageUrl: company.stampImageUrl ?? company.logoUrl,
    xpAwarded: company.xpAwarded ?? SCORES.COMPANY_VISIT,
    visitedAt,
  }
}

export async function listCompaniesForSession(
  session: Session
): Promise<CompanyListItem[]> {
  const profile = await requireProfileForSession(session)
  const [companies, visits] = await Promise.all([
    findActiveCompanies(profile.eventId),
    findCompanyVisitsByParticipant(profile.eventId, profile.userId),
  ])
  const visitsByCompany = new Map(
    visits.map((visit) => [visit.activityId, visit.completedAt])
  )

  return companies.map((company) =>
    toCompanyListItem(company, visitsByCompany.get(company.id) ?? null)
  )
}

export async function getCompanyDetailsForSession(
  session: Session,
  companyId: unknown
): Promise<CompanyDetails | null> {
  const validatedCompanyId = companyFieldsSchema.shape.id.parse(companyId)
  const profile = await requireProfileForSession(session)
  const company = await findCompanyById(profile.eventId, validatedCompanyId)

  if (!company) {
    return null
  }

  const visit = await findCompanyVisit(
    profile.eventId,
    profile.userId,
    company.id
  )

  return toCompanyListItem(company, visit?.completedAt ?? null)
}

export async function visitCompanyForSession(
  session: Session,
  input: unknown
): Promise<CompanyVisitOperationResult> {
  const target = visitCompanyInputSchema.parse(input)
  const profile = await requireProfileForSession(session)

  if (target.eventId !== env.EVENT_ID || profile.eventId !== target.eventId) {
    return { success: false, code: "INVALID_EVENT" }
  }

  if (!profile.onboardingCompleted) {
    return { success: false, code: "PROFILE_INCOMPLETE" }
  }

  const result = await completeCompanyVisit({
    eventId: target.eventId,
    qrId: target.qrId,
    participantId: profile.userId,
    defaultXpAwarded: SCORES.COMPANY_VISIT,
  })

  switch (result.status) {
    case "visited":
      await evaluateParticipantBadges(target.eventId, profile.userId, {
        type: "company",
        id: result.company.id,
      })

      return {
        success: true,
        code: "COMPANY_VISITED",
        companyName: result.company.name,
        xpAwarded: result.visit.xpAwarded,
      }
    case "already-visited":
      return {
        success: true,
        code: "COMPANY_ALREADY_VISITED",
        companyName: result.company.name,
        xpAwarded: result.visit.xpAwarded,
      }
    case "inactive":
      return { success: false, code: "COMPANY_INACTIVE" }
    case "not-found":
      return { success: false, code: "COMPANY_NOT_FOUND" }
    case "profile-unavailable":
      return { success: false, code: "PROFILE_INCOMPLETE" }
  }
}
