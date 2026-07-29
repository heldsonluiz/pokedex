import { describe, expect, it } from "vitest"

import { selectWeightedCandidate } from "./weighted-draw"

const candidates = [
  { participantId: "participant-1", ticketWeight: 1 },
  { participantId: "participant-2", ticketWeight: 3 },
  { participantId: "participant-3", ticketWeight: 2 },
]

describe("weighted draw", () => {
  it("maps every offset to the corresponding weighted interval", () => {
    expect(selectWeightedCandidate(candidates, 0)?.participantId).toBe(
      "participant-1"
    )
    expect(selectWeightedCandidate(candidates, 1)?.participantId).toBe(
      "participant-2"
    )
    expect(selectWeightedCandidate(candidates, 3)?.participantId).toBe(
      "participant-2"
    )
    expect(selectWeightedCandidate(candidates, 4)?.participantId).toBe(
      "participant-3"
    )
    expect(selectWeightedCandidate(candidates, 5)?.participantId).toBe(
      "participant-3"
    )
  })

  it("rejects an invalid or empty weighted universe", () => {
    expect(selectWeightedCandidate(candidates, 6)).toBeNull()
    expect(
      selectWeightedCandidate(
        [{ participantId: "participant", ticketWeight: 0 }],
        0
      )
    ).toBeNull()
  })
})
