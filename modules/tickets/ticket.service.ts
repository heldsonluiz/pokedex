import "server-only"

import type { Session } from "next-auth"

import { env } from "@/env"
import { hasPermission } from "@/modules/profile/profile.authorization"
import {
  getProfileByPublicQrId,
  requireProfileForSession,
} from "@/modules/profile/profile.service"
import { validateUserQrToken } from "@/modules/qr-code/user-qr-token"

import {
  convertXpToTickets,
  ensureOnboardingTicket,
  findEventOperations,
  findTicketTransactions,
  isTicketConversionEnabled,
  setRewardRedemptionEnabled,
  setTicketConversionEnabled,
} from "./ticket.repository"
import {
  assistedXpConversionInputSchema,
  convertXpInputSchema,
} from "./ticket.schema"
import { calculateConvertibleTickets } from "./ticket-calculator"

export type ParticipantTickets =
  | Readonly<{ available: false }>
  | Readonly<{
      available: true
      ticketBalance: number
      xp: number
      convertedXp: number
      convertibleXp: number
      convertibleTickets: number
      conversionEnabled: boolean
      transactions: Awaited<ReturnType<typeof findTicketTransactions>>
    }>

export async function getTicketsForSession(
  session: Session
): Promise<ParticipantTickets> {
  let profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "participate") || !profile.onboardingCompleted) {
    return { available: false }
  }

  await ensureOnboardingTicket(profile.eventId, profile.userId)
  profile = await requireProfileForSession(session)

  const [transactions, conversionEnabled] = await Promise.all([
    findTicketTransactions(profile.eventId, profile.userId),
    isTicketConversionEnabled(profile.eventId),
  ])
  const { convertibleXp, convertibleTickets } = calculateConvertibleTickets(
    profile.xp,
    profile.convertedXp
  )

  return {
    available: true,
    ticketBalance: profile.ticketBalance,
    xp: profile.xp,
    convertedXp: profile.convertedXp,
    convertibleXp,
    convertibleTickets,
    conversionEnabled,
    transactions,
  }
}

export async function convertXpForSession(session: Session, input: unknown) {
  const validatedInput = convertXpInputSchema.parse(input)
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "participate") || !profile.onboardingCompleted) {
    return { success: false as const, code: "FORBIDDEN" as const }
  }

  await ensureOnboardingTicket(profile.eventId, profile.userId)

  const result = await convertXpToTickets({
    eventId: profile.eventId,
    participantId: profile.userId,
    operatorId: profile.userId,
    input: validatedInput,
  })

  switch (result.status) {
    case "converted":
    case "already-converted":
      return {
        success: true as const,
        code:
          result.status === "converted"
            ? ("TICKETS_CONVERTED" as const)
            : ("ALREADY_CONVERTED" as const),
        ticketAmount: result.transaction.ticketDelta,
      }
    case "conversion-disabled":
      return { success: false as const, code: "CONVERSION_DISABLED" as const }
    case "insufficient-xp":
      return { success: false as const, code: "INSUFFICIENT_XP" as const }
    case "profile-unavailable":
      return { success: false as const, code: "FORBIDDEN" as const }
  }
}

export async function findParticipantServiceContext(
  session: Session,
  participantQrId: string,
  participantToken: string
) {
  const operator = await requireProfileForSession(session)

  if (!hasPermission(operator, "serve-participants")) {
    return null
  }

  const validation = validateUserQrToken({
    token: participantToken,
    eventId: operator.eventId,
    qrId: participantQrId,
  })

  if (!validation.valid || operator.eventId !== env.EVENT_ID) {
    return null
  }

  const participant = await getProfileByPublicQrId(
    operator.eventId,
    participantQrId
  )

  if (
    !participant?.onboardingCompleted ||
    !hasPermission(participant, "participate")
  ) {
    return null
  }

  return { operator, participant }
}

export async function getParticipantServiceForSession(
  session: Session,
  participantQrId: string,
  participantToken: string
) {
  const context = await findParticipantServiceContext(
    session,
    participantQrId,
    participantToken
  )

  if (!context) {
    return null
  }

  await ensureOnboardingTicket(
    context.participant.eventId,
    context.participant.userId
  )
  const refreshedParticipant = await getProfileByPublicQrId(
    context.participant.eventId,
    participantQrId
  )

  if (!refreshedParticipant) {
    return null
  }

  const { convertibleXp, convertibleTickets } = calculateConvertibleTickets(
    refreshedParticipant.xp,
    refreshedParticipant.convertedXp
  )

  return {
    participantName: refreshedParticipant.displayName,
    participantQrId,
    participantToken,
    ticketBalance: refreshedParticipant.ticketBalance,
    convertibleXp,
    convertibleTickets,
    conversionEnabled: await isTicketConversionEnabled(
      refreshedParticipant.eventId
    ),
  }
}

export async function convertParticipantXpForSession(
  session: Session,
  input: unknown
) {
  const validatedInput = assistedXpConversionInputSchema.parse(input)
  const context = await findParticipantServiceContext(
    session,
    validatedInput.participantQrId,
    validatedInput.participantToken
  )

  if (!context) {
    return { success: false as const, code: "FORBIDDEN" as const }
  }

  await ensureOnboardingTicket(
    context.participant.eventId,
    context.participant.userId
  )
  const result = await convertXpToTickets({
    eventId: context.participant.eventId,
    participantId: context.participant.userId,
    operatorId: context.operator.userId,
    input: validatedInput,
  })

  return result.status === "converted" || result.status === "already-converted"
    ? {
        success: true as const,
        code: result.status,
        ticketAmount: result.transaction.ticketDelta,
      }
    : { success: false as const, code: result.status }
}

export async function getOperationsForSession(session: Session) {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "serve-participants")) {
    return null
  }

  const operations = await findEventOperations(profile.eventId)

  return {
    canManage: hasPermission(profile, "manage-event-operations"),
    ...operations,
  }
}

export async function updateRedemptionAvailabilityForSession(
  session: Session,
  enabled: boolean
) {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "manage-event-operations")) {
    return false
  }

  await setRewardRedemptionEnabled(profile.eventId, enabled, profile.userId)

  return true
}

export async function updateConversionAvailabilityForSession(
  session: Session,
  enabled: boolean
) {
  const profile = await requireProfileForSession(session)

  if (!hasPermission(profile, "manage-event-operations")) {
    return false
  }

  await setTicketConversionEnabled(profile.eventId, enabled, profile.userId)

  return true
}
