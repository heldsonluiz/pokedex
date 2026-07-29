import { describe, expect, it } from "vitest"

import { calculateConvertibleTickets } from "./ticket-calculator"

describe("ticket calculator", () => {
  it("converts each complete 200 XP interval into one ticket", () => {
    expect(calculateConvertibleTickets(1_350, 600)).toEqual({
      convertibleXp: 750,
      convertibleTickets: 3,
    })
  })

  it("preserves XP that does not complete an exchange interval", () => {
    expect(calculateConvertibleTickets(450, 0)).toEqual({
      convertibleXp: 450,
      convertibleTickets: 2,
    })
  })

  it("blocks new conversions when revoked XP is below converted XP", () => {
    expect(calculateConvertibleTickets(400, 600)).toEqual({
      convertibleXp: 0,
      convertibleTickets: 0,
    })
  })
})
