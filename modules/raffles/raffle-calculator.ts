import {
  ONBOARDING_TICKET_AMOUNT,
  TICKET_EXCHANGE_RATE_XP,
} from "@/config/tickets"

export function calculateRaffleAllocation({
  xp,
  convertedXp,
  ticketBalance,
  hasOnboardingGrant,
}: {
  xp: number
  convertedXp: number
  ticketBalance: number
  hasOnboardingGrant: boolean
}) {
  const availableXp = Math.max(0, xp - convertedXp)
  const autoConvertedTickets = Math.floor(availableXp / TICKET_EXCHANGE_RATE_XP)
  const autoConvertedXp = autoConvertedTickets * TICKET_EXCHANGE_RATE_XP
  const onboardingTickets = hasOnboardingGrant ? 0 : ONBOARDING_TICKET_AMOUNT

  return {
    onboardingTickets,
    autoConvertedTickets,
    autoConvertedXp,
    ticketWeight: ticketBalance + onboardingTickets + autoConvertedTickets,
  }
}

export function calculateWinnerTicketDelta(
  ticketBalance: number,
  consumeWinnerTickets: boolean
) {
  return consumeWinnerTickets ? -Math.max(0, ticketBalance) : 0
}
