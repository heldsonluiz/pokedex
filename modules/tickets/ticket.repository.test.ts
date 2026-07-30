import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const get = vi.fn().mockResolvedValue({
    exists: true,
    data: () => ({
      userId: "participant-1",
      eventId: "event-1",
      onboardingCompleted: true,
      accessRoles: ["participant"],
      xp: 500,
      ticketBalance: 1,
      convertedXp: 0,
      onboardingTicketGranted: true,
    }),
  })
  const transaction = {
    create: vi.fn(),
    get,
    update: vi.fn(),
  }
  const firestore = {
    collection: vi.fn((collection: string) => ({
      doc: vi.fn((id: string) => ({ collection, id })),
    })),
    runTransaction: vi.fn(
      async (operation: (value: typeof transaction) => unknown) =>
        operation(transaction)
    ),
  }

  return { firestore, get, transaction }
})

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({ firestore: mocks.firestore }))
vi.mock("firebase-admin/firestore", () => {
  class Timestamp {
    static now() {
      return new Timestamp()
    }
  }

  return { Timestamp }
})

import { ensureOnboardingTicket } from "./ticket.repository"

describe("ticket repository", () => {
  it("trusts the profile projection without reading the grant transaction again", async () => {
    const result = await ensureOnboardingTicket("event-1", "participant-1")

    expect(result).toBe("already-granted")
    expect(mocks.get).toHaveBeenCalledTimes(1)
    expect(mocks.transaction.create).not.toHaveBeenCalled()
    expect(mocks.transaction.update).not.toHaveBeenCalled()
  })
})
