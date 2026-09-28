import { describe, expect, it } from "vitest"

import { raffleFieldsSchema } from "./raffle.schema"

const legacyPrize = {
  id: "prize-1",
  eventId: "devfest-triangulo-2026",
  prizeName: "Notebook",
  description: null,
  imageUrl: null,
  order: 0,
  active: true,
  status: "pending",
  winnerId: null,
  winnerName: null,
  eligibleParticipantCount: null,
  eligibleTicketTotal: null,
  randomOffset: null,
  drawnAt: null,
  drawnBy: null,
  createdAt: new Date("2026-09-28T12:00:00Z"),
  updatedAt: new Date("2026-09-28T12:00:00Z"),
}

describe("raffle sponsor compatibility", () => {
  it("reads legacy prizes without a sponsor", () => {
    expect(raffleFieldsSchema.parse(legacyPrize).sponsorId).toBeUndefined()
  })

  it.each([null, "sponsor-1"])(
    "preserves sponsor reference %s",
    (sponsorId) => {
      expect(
        raffleFieldsSchema.parse({ ...legacyPrize, sponsorId }).sponsorId
      ).toBe(sponsorId)
    }
  )

  it.each(["", "   ", "a".repeat(129), 123])(
    "rejects invalid sponsor reference %s",
    (sponsorId) => {
      expect(
        raffleFieldsSchema.safeParse({ ...legacyPrize, sponsorId }).success
      ).toBe(false)
    }
  )
})
