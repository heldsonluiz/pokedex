"use client"

import { LoaderCircle, LockKeyhole, UnlockKeyhole } from "lucide-react"
import { useActionState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import {
  toggleRewardRedemptionAction,
  toggleTicketConversionAction,
} from "./ticket.actions"

type OperationServiceToggleProps = Readonly<{
  service: "ticket-conversion" | "reward-redemption"
  enabled: boolean
}>

export function OperationServiceToggle({
  service,
  enabled,
}: OperationServiceToggleProps) {
  const action =
    service === "ticket-conversion"
      ? toggleTicketConversionAction
      : toggleRewardRedemptionAction
  const serviceLabel =
    service === "ticket-conversion" ? "conversões" : "resgates"
  const [, formAction, isPending] = useActionState(
    async (_state: null, formData: FormData) => {
      try {
        await action(formData)
      } catch {
        toast.error(`Não foi possível alterar ${serviceLabel}`, {
          description:
            "O estado anterior foi mantido. Verifique sua conexão e tente novamente.",
          duration: 5_000,
        })
      }

      return null
    },
    null
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="enabled" value={String(!enabled)} />
      <OperationServiceToggleButton
        enabled={enabled}
        serviceLabel={serviceLabel}
        isPending={isPending}
      />
    </form>
  )
}

function OperationServiceToggleButton({
  enabled,
  serviceLabel,
  isPending,
}: Readonly<{
  enabled: boolean
  serviceLabel: string
  isPending: boolean
}>) {
  const actionLabel = enabled ? "Bloquear" : "Liberar"
  const pendingLabel = enabled ? "Bloqueando" : "Liberando"

  return (
    <Button
      type="submit"
      size="icon"
      variant={enabled ? "destructive" : "outline"}
      disabled={isPending}
      aria-label={
        isPending
          ? `${pendingLabel} ${serviceLabel}`
          : `${actionLabel} ${serviceLabel}`
      }
    >
      {isPending ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : enabled ? (
        <LockKeyhole aria-hidden="true" />
      ) : (
        <UnlockKeyhole aria-hidden="true" />
      )}
    </Button>
  )
}
