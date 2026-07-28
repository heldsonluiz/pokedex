import { describe, expect, it } from "vitest"

import {
  connectionSchema,
  createConnectionRequestInputSchema,
  normalizeConnectionPair,
} from "./connection.schema"

const FIRST_PARTICIPANT = "participant-a"
const SECOND_PARTICIPANT = "participant-b"
const NOW = new Date("2026-07-28T12:00:00.000Z")

function createConnectionFixture() {
  return {
    id: "a".repeat(64),
    eventId: "devfest-2026",
    participantIds: [FIRST_PARTICIPANT, SECOND_PARTICIPANT],
    requesterId: FIRST_PARTICIPANT,
    recipientId: SECOND_PARTICIPANT,
    status: "accepted",
    requestCount: 1,
    xpAwardedPerParticipant: 5,
    firstRequestedAt: NOW,
    lastRequestedAt: NOW,
    acceptedAt: NOW,
    rejectedAt: null,
    removedAt: null,
    removedBy: null,
    xpGrantedAt: NOW,
    xpRevokedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

describe("connection schema", () => {
  it("normalizes participants into a stable pair", () => {
    expect(
      normalizeConnectionPair(SECOND_PARTICIPANT, FIRST_PARTICIPANT)
    ).toEqual([FIRST_PARTICIPANT, SECOND_PARTICIPANT])
  })

  it("rejects a connection with the same participant twice", () => {
    expect(() =>
      normalizeConnectionPair(FIRST_PARTICIPANT, FIRST_PARTICIPANT)
    ).toThrow()
  })

  it("accepts an active connection with the awarded XP", () => {
    expect(connectionSchema.parse(createConnectionFixture())).toMatchObject({
      status: "accepted",
      xpAwardedPerParticipant: 5,
    })
  })

  it("requires the timestamp corresponding to the current status", () => {
    const result = connectionSchema.safeParse({
      ...createConnectionFixture(),
      status: "accepted",
      acceptedAt: null,
    })

    expect(result.success).toBe(false)
  })

  it("requires the participant responsible for a removal", () => {
    const result = connectionSchema.safeParse({
      ...createConnectionFixture(),
      status: "removed",
      removedAt: NOW,
      removedBy: null,
    })

    expect(result.success).toBe(false)
  })

  it("does not allow XP timestamps without an awarded amount", () => {
    const result = connectionSchema.safeParse({
      ...createConnectionFixture(),
      xpAwardedPerParticipant: null,
      xpGrantedAt: NOW,
    })

    expect(result.success).toBe(false)
  })

  it("validates request input without accepting additional fields", () => {
    const result = createConnectionRequestInputSchema.safeParse({
      eventId: "devfest-2026",
      targetQrId: "123e4567-e89b-42d3-a456-426614174000",
      token: "signed-token",
      requesterId: FIRST_PARTICIPANT,
    })

    expect(result.success).toBe(false)
  })
})
