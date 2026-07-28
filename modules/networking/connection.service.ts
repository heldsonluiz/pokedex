import "server-only"

import type { Session } from "next-auth"

import { SCORES } from "@/config/scores"
import { env } from "@/env"
import {
  getProfileByPublicQrId,
  getProfileByUserId,
  requireProfileForSession,
} from "@/modules/profile/profile.service"
import { validateUserQrToken } from "@/modules/qr-code/user-qr-token"

import {
  findConnectionsByParticipant,
  removeConnection,
  requestConnection,
} from "./connection.repository"
import {
  connectionMutationInputSchema,
  createConnectionRequestInputSchema,
} from "./connection.schema"

export type NetworkingOperationResult =
  { success: true; code: string } | { success: false; code: string }

export type ConnectionListItem = Readonly<{
  id: string
  status: "accepted"
  direction: "connected"
  participant: {
    displayName: string
    avatarUrl: string | null
    role: string | null
    company: string | null
    email: string | null
  }
  updatedAt: Date
}>

export async function createConnectionRequestForSession(
  session: Session,
  input: unknown
): Promise<NetworkingOperationResult> {
  const { eventId, targetQrId, token } =
    createConnectionRequestInputSchema.parse(input)
  const requester = await requireProfileForSession(session)

  if (eventId !== env.EVENT_ID || requester.eventId !== eventId) {
    return { success: false, code: "INVALID_EVENT" }
  }

  const qrValidation = validateUserQrToken({
    token,
    eventId,
    qrId: targetQrId,
  })

  if (!qrValidation.valid) {
    return {
      success: false,
      code: qrValidation.code === "QR_EXPIRED" ? "QR_EXPIRED" : "INVALID_QR",
    }
  }

  const recipient = await getProfileByPublicQrId(requester.eventId, targetQrId)

  if (!recipient?.onboardingCompleted) {
    return { success: false, code: "PROFILE_NOT_FOUND" }
  }

  if (recipient.userId === requester.userId) {
    return { success: false, code: "SELF_CONNECTION" }
  }

  const result = await requestConnection({
    eventId: requester.eventId,
    requesterId: requester.userId,
    recipientId: recipient.userId,
    xpAwardedPerParticipant: SCORES.PARTICIPANT_CONNECTION,
  })

  switch (result) {
    case "connected":
      return { success: true, code: "CONNECTION_CREATED" }
    case "already-connected":
      return { success: true, code: "ALREADY_CONNECTED" }
    case "cooldown":
      return { success: false, code: "SCAN_COOLDOWN" }
  }
}

export async function removeConnectionForSession(
  session: Session,
  input: unknown
): Promise<NetworkingOperationResult> {
  const { connectionId } = connectionMutationInputSchema.parse(input)
  const profile = await requireProfileForSession(session)
  const result = await removeConnection({
    connectionId,
    eventId: profile.eventId,
    participantId: profile.userId,
  })

  if (result === "removed" || result === "already-removed") {
    return { success: true, code: "CONNECTION_REMOVED" }
  }

  return {
    success: false,
    code:
      result === "not-participant"
        ? "NOT_CONNECTION_PARTICIPANT"
        : result === "not-found"
          ? "CONNECTION_NOT_FOUND"
          : "CONNECTION_NOT_ACCEPTED",
  }
}

export async function listConnectionsForSession(
  session: Session
): Promise<ConnectionListItem[]> {
  const profile = await requireProfileForSession(session)
  const connections = await findConnectionsByParticipant(
    profile.eventId,
    profile.userId
  )
  const visibleConnections = connections.filter(
    (connection) => connection.status === "accepted"
  )

  return Promise.all(
    visibleConnections.map(async (connection) => {
      const otherParticipantId = connection.participantIds.find(
        (participantId) => participantId !== profile.userId
      )

      if (!otherParticipantId) {
        throw new Error(
          "Stored connection does not contain another participant"
        )
      }

      const otherProfile = await getProfileByUserId(otherParticipantId)

      if (
        !otherProfile ||
        otherProfile.eventId !== profile.eventId ||
        !otherProfile.onboardingCompleted
      ) {
        throw new Error("Connected profile is not available")
      }

      return {
        id: connection.id,
        status: "accepted",
        direction: "connected",
        participant: {
          displayName: otherProfile.displayName,
          avatarUrl: otherProfile.avatarUrl,
          role: otherProfile.role,
          company: otherProfile.company,
          email: otherProfile.email,
        },
        updatedAt: connection.updatedAt,
      }
    })
  )
}
