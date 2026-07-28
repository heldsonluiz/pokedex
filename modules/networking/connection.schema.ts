import * as z from "zod"

export const CONNECTION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "removed",
] as const

export const connectionStatusSchema = z.enum(CONNECTION_STATUSES)

const participantIdSchema = z.string().trim().min(1).max(128)
const connectionIdSchema = z.string().regex(/^[a-f0-9]{64}$/)

export const connectionPairSchema = z
  .tuple([participantIdSchema, participantIdSchema])
  .refine(([first, second]) => first !== second, {
    message: "A connection requires two different participants",
  })
  .refine(([first, second]) => first.localeCompare(second) < 0, {
    message: "Connection participants must use canonical order",
  })

export const createConnectionRequestInputSchema = z
  .object({
    eventId: z.string().trim().min(1).max(128),
    targetQrId: z.string().uuid(),
    token: z.string().trim().min(1).max(2_048),
  })
  .strict()

export const connectionMutationInputSchema = z
  .object({
    connectionId: connectionIdSchema,
  })
  .strict()

export const connectionFieldsSchema = z
  .object({
    id: connectionIdSchema,
    eventId: z.string().trim().min(1).max(128),
    participantIds: connectionPairSchema,
    requesterId: participantIdSchema,
    recipientId: participantIdSchema,
    status: connectionStatusSchema,
    requestCount: z.number().int().positive(),
    xpAwardedPerParticipant: z.number().int().positive().nullable(),
    firstRequestedAt: z.date(),
    lastRequestedAt: z.date(),
    acceptedAt: z.date().nullable(),
    rejectedAt: z.date().nullable(),
    removedAt: z.date().nullable(),
    removedBy: participantIdSchema.nullable(),
    xpGrantedAt: z.date().nullable(),
    xpRevokedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export const connectionSchema = connectionFieldsSchema.superRefine(
  (connection, context) => {
    const participants = new Set(connection.participantIds)

    if (
      !participants.has(connection.requesterId) ||
      !participants.has(connection.recipientId) ||
      connection.requesterId === connection.recipientId
    ) {
      context.addIssue({
        code: "custom",
        message: "Requester and recipient must match the connection pair",
        path: ["requesterId"],
      })
    }

    if (connection.firstRequestedAt > connection.lastRequestedAt) {
      context.addIssue({
        code: "custom",
        message: "First request cannot be newer than the last request",
        path: ["lastRequestedAt"],
      })
    }

    const statusTimestamp = {
      accepted: connection.acceptedAt,
      pending: connection.lastRequestedAt,
      rejected: connection.rejectedAt,
      removed: connection.removedAt,
    }[connection.status]

    if (!statusTimestamp) {
      context.addIssue({
        code: "custom",
        message: "Connection status requires its corresponding timestamp",
        path: ["status"],
      })
    }

    if (
      connection.status === "removed" &&
      (!connection.removedBy || !participants.has(connection.removedBy))
    ) {
      context.addIssue({
        code: "custom",
        message: "Removed connection requires the participant who removed it",
        path: ["removedBy"],
      })
    }

    if (
      connection.xpAwardedPerParticipant === null &&
      (connection.xpGrantedAt !== null || connection.xpRevokedAt !== null)
    ) {
      context.addIssue({
        code: "custom",
        message: "XP timestamps require a recorded XP amount",
        path: ["xpAwardedPerParticipant"],
      })
    }

    if (
      connection.xpAwardedPerParticipant !== null &&
      connection.xpGrantedAt === null
    ) {
      context.addIssue({
        code: "custom",
        message: "Recorded XP requires its grant timestamp",
        path: ["xpGrantedAt"],
      })
    }
  }
)

export type Connection = z.infer<typeof connectionSchema>
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>
export type CreateConnectionRequestInput = z.infer<
  typeof createConnectionRequestInputSchema
>
export type ConnectionMutationInput = z.infer<
  typeof connectionMutationInputSchema
>

export function normalizeConnectionPair(
  firstParticipantId: string,
  secondParticipantId: string
) {
  const participants = [firstParticipantId, secondParticipantId].sort(
    (first, second) => first.localeCompare(second)
  )

  return connectionPairSchema.parse(participants)
}
