import {
  CheckCircle2,
  Dices,
  FlaskConical,
  Gift,
  LockKeyhole,
  MonitorUp,
  ScanLine,
  Ticket,
  Trophy,
  UnlockKeyhole,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button, buttonVariants } from "@/components/ui/button"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { getRaffleOperationsForSession } from "@/modules/raffles/raffle.service"
import { RaffleAutoProcessor } from "@/modules/raffles/raffle-auto-processor"
import {
  ArchiveRaffleSimulationButton,
  BeginRaffleClosureButton,
  DrawRaffleButton,
  PostRaffleRedemptionsButton,
  RaffleCandidateActions,
  StartRaffleSimulationButton,
} from "@/modules/raffles/raffle-operation-buttons"
import {
  toggleRewardRedemptionAction,
  toggleTicketConversionAction,
} from "@/modules/tickets/ticket.actions"
import { getOperationsForSession } from "@/modules/tickets/ticket.service"

export const metadata: Metadata = { title: "Operações" }
export const dynamic = "force-dynamic"

export default async function OperationsPage() {
  const session = await requireAuth()
  const operations = await getOperationsForSession(session)

  if (!operations) {
    notFound()
  }

  const raffleOperations = operations.canManage
    ? await getRaffleOperationsForSession(session)
    : null
  const operationsAreOpen = operations.raffleClosureStatus === "open"
  const simulation = raffleOperations?.simulation ?? null
  const simulationRequiresRestart = simulation?.snapshotFormat === "legacy"
  const displayedRaffles =
    simulation?.raffles ?? raffleOperations?.raffles ?? []
  const displayedStatus = simulation
    ? simulation.status === "preparing"
      ? "processing"
      : "closed"
    : raffleOperations?.closure.status
  const displayedProcessedParticipants =
    simulation?.processedParticipants ??
    raffleOperations?.closure.processedParticipants ??
    0
  const displayedRedemptionEnabled =
    simulation?.rewardRedemptionEnabled ?? operations.rewardRedemptionEnabled
  const allRafflesWereDrawn =
    raffleOperations !== null &&
    displayedRaffles.length > 0 &&
    displayedRaffles.every((raffle) => raffle.status === "drawn")

  return (
    <div className="space-y-7 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Central de operações
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Atenda participantes e acompanhe os serviços disponíveis.
        </p>
      </section>

      {simulation && (
        <div className="space-y-3 rounded-2xl border border-secondary/50 bg-secondary/10 p-4">
          <div className="flex items-start gap-3">
            <FlaskConical
              className="mt-0.5 size-5 shrink-0 text-secondary-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Modo de teste ativo</p>
              <p className="mt-1 text-sm text-muted-foreground">
                As ações de sorteio usam somente a fotografia isolada desta
                simulação. Perfis, tickets, prêmios e operações reais não serão
                alterados.
              </p>
            </div>
          </div>
          <ArchiveRaffleSimulationButton />
        </div>
      )}

      {!simulation && (
        <Link
          href="/operations/scan"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          <ScanLine aria-hidden="true" />
          Escanear participante
        </Link>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Serviços</h2>
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              operations.ticketConversionEnabled
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Ticket className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Conversão de XP</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {operations.ticketConversionEnabled
                ? "Conversões liberadas"
                : "Conversões bloqueadas"}
            </p>
          </div>

          {operations.canManage && operationsAreOpen && !simulation && (
            <form action={toggleTicketConversionAction}>
              <input
                type="hidden"
                name="enabled"
                value={String(!operations.ticketConversionEnabled)}
              />
              <Button
                type="submit"
                size="icon"
                variant={
                  operations.ticketConversionEnabled ? "destructive" : "outline"
                }
                aria-label={
                  operations.ticketConversionEnabled
                    ? "Bloquear conversões"
                    : "Liberar conversões"
                }
              >
                {operations.ticketConversionEnabled ? (
                  <LockKeyhole aria-hidden="true" />
                ) : (
                  <UnlockKeyhole aria-hidden="true" />
                )}
              </Button>
            </form>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              operations.rewardRedemptionEnabled
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Gift className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Resgate de brindes</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {operations.rewardRedemptionEnabled
                ? "Resgates liberados"
                : "Resgates bloqueados"}
            </p>
          </div>

          {operations.canManage && operationsAreOpen && !simulation && (
            <form action={toggleRewardRedemptionAction}>
              <input
                type="hidden"
                name="enabled"
                value={String(!operations.rewardRedemptionEnabled)}
              />
              <Button
                type="submit"
                size="icon"
                variant={
                  operations.rewardRedemptionEnabled ? "destructive" : "outline"
                }
                aria-label={
                  operations.rewardRedemptionEnabled
                    ? "Bloquear resgates"
                    : "Liberar resgates"
                }
              >
                {operations.rewardRedemptionEnabled ? (
                  <LockKeyhole aria-hidden="true" />
                ) : (
                  <UnlockKeyhole aria-hidden="true" />
                )}
              </Button>
            </form>
          )}
        </div>
      </section>

      {raffleOperations && (
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Fechamento e sorteios</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Congele os tickets antes de sortear os prêmios.
              </p>
            </div>
            <Link
              href="/raffles/live"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <MonitorUp aria-hidden="true" />
              Telão
            </Link>
          </div>

          <div className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  displayedStatus === "closed"
                    ? "bg-success/10 text-success"
                    : "bg-primary/10 text-primary"
                )}
              >
                {displayedStatus === "closed" ? (
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                ) : (
                  <Trophy className="size-6" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {displayedStatus === "open" && "Evento em operação"}
                  {displayedStatus === "processing" &&
                    (simulation
                      ? "Preparando simulação"
                      : "Fechamento em andamento")}
                  {displayedStatus === "closed" &&
                    (simulation ? "Simulação preparada" : "Tickets congelados")}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {displayedStatus === "open"
                    ? "Conversões e resgates ainda podem ser administrados."
                    : `${displayedProcessedParticipants} participantes processados.`}
                </p>
              </div>
            </div>

            {!simulation && displayedStatus === "open" && (
              <BeginRaffleClosureButton />
            )}
            {displayedStatus === "processing" && !simulationRequiresRestart && (
              <RaffleAutoProcessor
                mode={simulation ? "simulation" : "closure"}
                processedParticipants={displayedProcessedParticipants}
              />
            )}
            {simulationRequiresRestart && (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                Esta simulação usa o formato anterior. Encerre-a e inicie uma
                nova execução para utilizar a fotografia otimizada.
              </p>
            )}
          </div>

          {!simulation && operationsAreOpen && <StartRaffleSimulationButton />}

          {displayedStatus === "closed" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Dices className="size-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">Prêmios</h3>
              </div>

              {displayedRaffles.length === 0 ? (
                <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  Nenhum sorteio ativo foi cadastrado para este evento.
                </p>
              ) : (
                displayedRaffles.map((raffle) => (
                  <article
                    key={raffle.id}
                    className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary-foreground">
                        <Trophy aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{raffle.prizeName}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {raffle.status === "drawn"
                            ? `Vencedor: ${raffle.winnerName}`
                            : raffle.status === "awaiting_confirmation"
                              ? `Candidato: ${raffle.currentCandidateName}`
                              : "Aguardando sorteio"}
                        </p>
                      </div>
                      {raffle.status === "pending" && (
                        <DrawRaffleButton
                          raffleId={raffle.id}
                          prizeName={raffle.prizeName}
                        />
                      )}
                    </div>

                    {raffle.status === "awaiting_confirmation" &&
                      raffle.currentCandidateName &&
                      raffle.currentAttemptId && (
                        <RaffleCandidateActions
                          raffleId={raffle.id}
                          attemptId={raffle.currentAttemptId}
                          candidateName={raffle.currentCandidateName}
                        />
                      )}
                  </article>
                ))
              )}

              {(allRafflesWereDrawn || displayedRedemptionEnabled) && (
                <div className="space-y-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                  <p className="font-semibold">Resgates após os sorteios</p>
                  <p className="text-sm text-muted-foreground">
                    {displayedRedemptionEnabled
                      ? "Os tickets restantes podem ser trocados por brindes."
                      : "Todos os sorteios terminaram. Você pode liberar os saldos restantes para brindes."}
                  </p>
                  <PostRaffleRedemptionsButton
                    enabled={displayedRedemptionEnabled}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {!operations.canManage && (
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          Reviewers podem atender participantes. Bloqueios e configurações são
          controlados por administradores.
        </p>
      )}
    </div>
  )
}
