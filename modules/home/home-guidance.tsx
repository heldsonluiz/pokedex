import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { TICKET_EXCHANGE_RATE_XP } from "@/config/tickets"
import { cn } from "@/lib/utils"
import { calculateConvertibleTickets } from "@/modules/tickets/ticket-calculator"

export function HomeTicketProgress({
  xp,
  convertedXp,
  conversionEnabled,
}: Readonly<{
  xp: number
  convertedXp: number
  conversionEnabled: boolean
}>) {
  const { convertibleXp, convertibleTickets } = calculateConvertibleTickets(
    xp,
    convertedXp
  )
  const ready = convertibleTickets > 0
  const progress = Math.min(TICKET_EXCHANGE_RATE_XP, convertibleXp)

  return (
    <section
      className="space-y-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/10"
      aria-labelledby="ticket-progress-title"
    >
      <p className="text-xs font-medium text-muted-foreground">
        Seus próximos tickets
      </p>
      <h2 id="ticket-progress-title" className="text-lg font-semibold">
        {!conversionEnabled
          ? "Conversões bloqueadas pela organização"
          : ready
            ? "Você já pode converter XP!"
            : `Faltam ${TICKET_EXCHANGE_RATE_XP - progress} XP para mais um ticket`}
      </h2>
      <p className="text-sm text-muted-foreground">
        {ready
          ? `Seu XP ainda não convertido rende ${convertibleTickets} ${convertibleTickets === 1 ? "ticket" : "tickets"}.`
          : `${progress} de ${TICKET_EXCHANGE_RATE_XP} XP ainda não convertidos.`}{" "}
        Converter mantém seu XP, nível e posição no ranking.
      </p>
      <div
        role="progressbar"
        aria-label="XP disponível para converter um ticket"
        aria-valuemin={0}
        aria-valuemax={TICKET_EXCHANGE_RATE_XP}
        aria-valuenow={progress}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(progress / TICKET_EXCHANGE_RATE_XP) * 100}%` }}
        />
      </div>
      <Link
        href="/tickets"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        {conversionEnabled && ready
          ? "Ver tickets e converter"
          : "Ver meus tickets"}
      </Link>
    </section>
  )
}
