import { describe, expect, it } from "vitest"

import { getRewardAvailability } from "./reward-policy"

const availableReward = {
  redemptionEnabled: true,
  ticketBalance: 10,
  ticketCost: 3,
  stock: 5,
  redeemedQuantity: 0,
  redemptionLimit: 1,
}

describe("reward policy", () => {
  it("allows an eligible redemption", () => {
    expect(getRewardAvailability(availableReward)).toEqual({
      canRedeem: true,
      unavailableReason: null,
    })
  })

  it("prioritizes the global redemption lock", () => {
    expect(
      getRewardAvailability({
        ...availableReward,
        redemptionEnabled: false,
      })
    ).toEqual({
      canRedeem: false,
      unavailableReason: "Resgates bloqueados",
    })
  })

  it("blocks limits, stock and insufficient balances", () => {
    expect(
      getRewardAvailability({ ...availableReward, redeemedQuantity: 1 })
        .unavailableReason
    ).toBe("Limite atingido")
    expect(
      getRewardAvailability({ ...availableReward, stock: 0 }).unavailableReason
    ).toBe("Estoque esgotado")
    expect(
      getRewardAvailability({ ...availableReward, ticketBalance: 2 })
        .unavailableReason
    ).toBe("Saldo insuficiente")
  })
})
