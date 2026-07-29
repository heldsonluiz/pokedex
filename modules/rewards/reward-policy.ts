export function getRewardAvailability({
  redemptionEnabled,
  ticketBalance,
  ticketCost,
  stock,
  redeemedQuantity,
  redemptionLimit,
}: {
  redemptionEnabled: boolean
  ticketBalance: number
  ticketCost: number
  stock: number
  redeemedQuantity: number
  redemptionLimit: number | null
}) {
  if (!redemptionEnabled) {
    return { canRedeem: false, unavailableReason: "Resgates bloqueados" }
  }

  if (redemptionLimit !== null && redeemedQuantity >= redemptionLimit) {
    return { canRedeem: false, unavailableReason: "Limite atingido" }
  }

  if (stock === 0) {
    return { canRedeem: false, unavailableReason: "Estoque esgotado" }
  }

  if (ticketBalance < ticketCost) {
    return { canRedeem: false, unavailableReason: "Saldo insuficiente" }
  }

  return { canRedeem: true, unavailableReason: null }
}
