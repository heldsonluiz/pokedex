import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const get = vi.fn()
  const limit = vi.fn()
  const orderBy = vi.fn()
  const select = vi.fn()
  const startAfter = vi.fn()
  const where = vi.fn()
  const query = { get, limit, orderBy, select, startAfter, where }

  Object.values(query).forEach((method) => method.mockReturnValue(query))

  return {
    collection: vi.fn(() => query),
    get,
    limit,
    orderBy,
    select,
    startAfter,
    where,
  }
})

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({
  firestore: { collection: mocks.collection },
}))
vi.mock("firebase-admin/firestore", () => {
  class Timestamp {
    constructor(private readonly milliseconds: number) {}

    static fromMillis(milliseconds: number) {
      return new Timestamp(milliseconds)
    }

    toMillis() {
      return this.milliseconds
    }
  }

  return {
    FieldPath: { documentId: () => "__name__" },
    Timestamp,
  }
})

import { Timestamp } from "firebase-admin/firestore"

import { findRaffleProfilePage } from "./raffle-profile-query"

describe("raffle profile query", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.get.mockResolvedValue({
      size: 1,
      docs: [
        {
          id: "participant-1",
          data: () => ({
            userId: "participant-1",
            xp: 350,
            xpReachedAt: Timestamp.fromMillis(500),
          }),
        },
      ],
    })
  })

  it("reuses the ranking index for a new raffle snapshot", async () => {
    const result = await findRaffleProfilePage({
      eventId: "event-1",
      batchSize: 100,
      cursor: null,
    })

    expect(mocks.where).toHaveBeenNthCalledWith(1, "eventId", "==", "event-1")
    expect(mocks.where).toHaveBeenNthCalledWith(
      2,
      "onboardingCompleted",
      "==",
      true
    )
    expect(mocks.where).toHaveBeenNthCalledWith(
      3,
      "accessRoles",
      "array-contains",
      "participant"
    )
    expect(mocks.orderBy).toHaveBeenNthCalledWith(1, "xp", "desc")
    expect(mocks.orderBy).toHaveBeenNthCalledWith(2, "xpReachedAt", "asc")
    expect(mocks.orderBy).toHaveBeenNthCalledWith(3, "userId", "asc")
    expect(mocks.select).toHaveBeenCalledWith(
      "userId",
      "eventId",
      "displayName",
      "onboardingCompleted",
      "accessRoles",
      "xp",
      "xpReachedAt",
      "ticketBalance",
      "convertedXp",
      "onboardingTicketGranted"
    )
    expect(result.nextCursor).toEqual({
      xp: 350,
      xpReachedAtMs: 500,
      userId: "participant-1",
    })
  })

  it("keeps document-ID pagination for an in-progress legacy snapshot", async () => {
    await findRaffleProfilePage({
      eventId: "event-1",
      batchSize: 100,
      cursor: "participant-before-upgrade",
    })

    expect(mocks.where).toHaveBeenCalledTimes(1)
    expect(mocks.orderBy).toHaveBeenCalledWith("__name__")
    expect(mocks.startAfter).toHaveBeenCalledWith("participant-before-upgrade")
  })

  it("resumes an indexed snapshot after all cursor fields", async () => {
    await findRaffleProfilePage({
      eventId: "event-1",
      batchSize: 100,
      cursor: {
        xp: 250,
        xpReachedAtMs: 750,
        userId: "participant-before-cursor",
      },
    })

    expect(mocks.startAfter).toHaveBeenCalledWith(
      250,
      expect.objectContaining({}),
      "participant-before-cursor"
    )
  })
})
