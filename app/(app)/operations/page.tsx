import {
  Gift,
  LockKeyhole,
  ScanLine,
  Ticket,
  UnlockKeyhole,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button, buttonVariants } from "@/components/ui/button"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
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

      <Link
        href="/operations/scan"
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        <ScanLine aria-hidden="true" />
        Escanear participante
      </Link>

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

          {operations.canManage && (
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

          {operations.canManage && (
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

      {!operations.canManage && (
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          Reviewers podem atender participantes. Bloqueios e configurações são
          controlados por administradores.
        </p>
      )}
    </div>
  )
}
