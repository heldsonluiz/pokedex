import { describe, expect, it } from "vitest"

import {
  calculateRaffleAllocation,
  calculateWinnerTicketDelta,
} from "./raffle-calculator"

describe("raffle allocation", () => {
  it("includes the current balance and converts only the remaining XP", () => {
    expect(
      calculateRaffleAllocation({
        xp: 950,
        convertedXp: 400,
        ticketBalance: 2,
        hasOnboardingGrant: true,
      })
    ).toEqual({
      onboardingTickets: 0,
      autoConvertedTickets: 2,
      autoConvertedXp: 400,
      ticketWeight: 4,
    })
  })

  it("includes the onboarding grant when it was never recorded", () => {
    expect(
      calculateRaffleAllocation({
        xp: 0,
        convertedXp: 0,
        ticketBalance: 0,
        hasOnboardingGrant: false,
      }).ticketWeight
    ).toBe(1)
  })

  it("does not reconvert XP when a revocation lowered the current XP", () => {
    expect(
      calculateRaffleAllocation({
        xp: 100,
        convertedXp: 200,
        ticketBalance: 0,
        hasOnboardingGrant: true,
      }).autoConvertedTickets
    ).toBe(0)
  })
})

describe("winner ticket consumption", () => {
  it("consumes the full available balance when the rule is enabled", () => {
    expect(calculateWinnerTicketDelta(12, true)).toBe(-12)
  })

  it("preserves the balance when the rule is disabled", () => {
    expect(calculateWinnerTicketDelta(12, false)).toBe(0)
  })
})
