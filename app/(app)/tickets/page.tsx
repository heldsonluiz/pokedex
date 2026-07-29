import { randomUUID } from "node:crypto"

import { Clock3, Ticket, Zap } from "lucide-react"
import type { Metadata } from "next"

import { TICKET_EXCHANGE_RATE_XP } from "@/config/tickets"
import { requireAuth } from "@/lib/require-auth"
import { getTicketsForSession } from "@/modules/tickets/ticket.service"
import { TicketConversionForm } from "@/modules/tickets/ticket-conversion-form"

export const metadata: Metadata = { title: "Tickets" }
export const dynamic = "force-dynamic"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export default async function TicketsPage() {
  const session = await requireAuth()
  const tickets = await getTicketsForSession(session)

  if (!tickets.available) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="rounded-full bg-gamification/10 p-4 text-gamification">
          <Ticket className="size-8" aria-hidden="true" />
        </span>
        <div className="max-w-sm space-y-2">
          <h1 className="text-xl font-semibold">Tickets de participantes</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Esta área está disponível somente para participantes do evento.
          </p>
        </div>
      </section>
    )
  }

  const conversionIdempotencyKey = randomUUID()

  return (
    <div className="space-y-7 p-6">
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Seus tickets</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Converta XP disponível em chances para brindes e sorteios.
          </p>
        </div>

        <div className="rounded-2xl bg-(image:--gradient-gamification) p-5 text-gamification-foreground shadow-glow-gamification">
          <p className="text-sm font-medium opacity-75">Saldo disponível</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="font-pixel-square text-4xl tabular-nums">
              {tickets.ticketBalance}
            </p>
            <Ticket className="size-10" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm font-medium">
            {tickets.ticketBalance === 1 ? "ticket" : "tickets"}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="font-semibold">Converter XP</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Cada {TICKET_EXCHANGE_RATE_XP} XP disponíveis equivalem a um ticket.
            Seu nível e sua posição no ranking não diminuem.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TicketMetric label="XP conversível" value={tickets.convertibleXp} />
          <TicketMetric
            label="Tickets possíveis"
            value={tickets.convertibleTickets}
          />
        </div>

        {!tickets.conversionEnabled ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            As conversões estão temporariamente bloqueadas pela organização.
          </p>
        ) : tickets.convertibleTickets === 0 ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            Acumule pelo menos {TICKET_EXCHANGE_RATE_XP} XP disponíveis para
            realizar uma conversão.
          </p>
        ) : (
          <TicketConversionForm
            key={conversionIdempotencyKey}
            convertibleTickets={tickets.convertibleTickets}
            idempotencyKey={conversionIdempotencyKey}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Histórico</h2>
        <div className="space-y-2">
          {tickets.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-gamification/10 text-gamification">
                {transaction.type === "xp_conversion" ? (
                  <Zap className="size-5" aria-hidden="true" />
                ) : (
                  <Ticket className="size-5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {transaction.type === "onboarding_grant"
                    ? "Ticket inicial"
                    : transaction.type === "xp_conversion"
                      ? "Conversão de XP"
                      : transaction.type === "reward_redemption"
                        ? "Resgate de brinde"
                        : "Ajuste de tickets"}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="size-3" aria-hidden="true" />
                  {dateFormatter.format(transaction.createdAt)}
                </p>
              </div>
              <span className="font-pixel-square text-sm text-gamification">
                {transaction.ticketDelta > 0 ? "+" : ""}
                {transaction.ticketDelta}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function TicketMetric({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="font-pixel-square text-xl text-gamification tabular-nums">
        {value.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
