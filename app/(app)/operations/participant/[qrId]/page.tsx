import { randomUUID } from "node:crypto"

import { Gift, ScanLine, Ticket, UserRound, Zap } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { getRewardsForParticipantService } from "@/modules/rewards/reward.service"
import { RewardRedemptionButton } from "@/modules/rewards/reward-redemption-button"
import { TicketConversionForm } from "@/modules/tickets/ticket-conversion-form"

export const metadata: Metadata = { title: "Atendimento" }
export const dynamic = "force-dynamic"

type ParticipantServicePageProps = Readonly<{
  params: Promise<{ qrId: string }>
  searchParams: Promise<{ token?: string | string[] }>
}>

export default async function ParticipantServicePage({
  params,
  searchParams,
}: ParticipantServicePageProps) {
  const [{ qrId }, query, session] = await Promise.all([
    params,
    searchParams,
    requireAuth(),
  ])
  const token = typeof query.token === "string" ? query.token : ""
  const participant = await getRewardsForParticipantService(
    session,
    qrId,
    token
  )

  if (!participant) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <ScanLine className="size-9 text-primary" aria-hidden="true" />
        <div className="max-w-sm space-y-2">
          <h1 className="text-xl font-semibold">
            Escaneie novamente o participante
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            O QR Code expirou, não pertence ao evento ou o atendimento não está
            autorizado.
          </p>
        </div>
        <Link
          href="/operations/scan"
          className={buttonVariants({ size: "lg" })}
        >
          Abrir scanner
        </Link>
      </section>
    )
  }

  const idempotencyKey = randomUUID()

  return (
    <div className="space-y-6 p-6">
      <section className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback>
            <UserRound className="size-7" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Participante</p>
          <h1 className="truncate text-xl font-bold tracking-tight">
            {participant.participantName}
          </h1>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <OperationMetric
          icon={Ticket}
          label="Saldo de tickets"
          value={participant.ticketBalance}
        />
        <OperationMetric
          icon={Zap}
          label="XP conversível"
          value={participant.convertibleXp}
        />
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div>
          <h2 className="font-semibold">Converter XP</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Até {participant.convertibleTickets} tickets disponíveis.
          </p>
        </div>

        {!participant.conversionEnabled ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            As conversões estão bloqueadas pela organização.
          </p>
        ) : participant.convertibleTickets === 0 ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            Este participante não possui XP suficiente para conversão.
          </p>
        ) : (
          <TicketConversionForm
            key={idempotencyKey}
            convertibleTickets={participant.convertibleTickets}
            idempotencyKey={idempotencyKey}
            participant={{ qrId, token }}
          />
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Brindes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirme a entrega antes de consumir os tickets.
          </p>
        </div>

        {participant.rewards.length === 0 ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            Nenhum brinde está disponível.
          </p>
        ) : (
          <div className="space-y-2">
            {participant.rewards.map((reward) => {
              const redemptionIdempotencyKey = randomUUID()

              return (
                <article
                  key={reward.id}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10"
                >
                  <Avatar className="size-14 rounded-xl">
                    <AvatarImage
                      src={reward.imageUrl}
                      alt=""
                      className="rounded-xl object-contain"
                    />
                    <AvatarFallback className="rounded-xl">
                      <Gift aria-hidden="true" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {reward.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {reward.ticketCost}{" "}
                      {reward.ticketCost === 1 ? "ticket" : "tickets"} · Estoque{" "}
                      {reward.stock}
                    </p>
                    {reward.redeemedQuantity > 0 && (
                      <p className="mt-0.5 text-xs text-primary">
                        {reward.redeemedQuantity} já resgatado
                      </p>
                    )}
                  </div>

                  {reward.canRedeem ? (
                    <RewardRedemptionButton
                      key={redemptionIdempotencyKey}
                      reward={reward}
                      participantQrId={qrId}
                      participantToken={token}
                      idempotencyKey={redemptionIdempotencyKey}
                    />
                  ) : (
                    <span className="max-w-20 text-right text-xs text-muted-foreground">
                      {reward.unavailableReason}
                    </span>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Link
        href="/operations/scan"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <ScanLine aria-hidden="true" />
        Atender outra pessoa
      </Link>
    </div>
  )
}

function OperationMetric({
  icon: Icon,
  label,
  value,
}: Readonly<{
  icon: typeof Ticket
  label: string
  value: number
}>) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <Icon className="size-5 text-primary" aria-hidden="true" />
      <p className="mt-3 font-pixel-square text-xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
