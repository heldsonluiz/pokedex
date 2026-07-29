import { TICKET_EXCHANGE_RATE_XP } from "@/config/tickets"

export function calculateConvertibleTickets(xp: number, convertedXp: number) {
  const convertibleXp = Math.max(0, xp - convertedXp)

  return {
    convertibleXp,
    convertibleTickets: Math.floor(convertibleXp / TICKET_EXCHANGE_RATE_XP),
  }
}
