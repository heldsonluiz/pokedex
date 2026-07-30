"use client"

import { LoaderCircle, LockKeyhole, UnlockKeyhole } from "lucide-react"
import { useFormStatus } from "react-dom"

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

  return (
    <form action={action}>
      <input type="hidden" name="enabled" value={String(!enabled)} />
      <OperationServiceToggleButton
        enabled={enabled}
        serviceLabel={serviceLabel}
      />
    </form>
  )
}

function OperationServiceToggleButton({
  enabled,
  serviceLabel,
}: Readonly<{
  enabled: boolean
  serviceLabel: string
}>) {
  const { pending } = useFormStatus()
  const actionLabel = enabled ? "Bloquear" : "Liberar"
  const pendingLabel = enabled ? "Bloqueando" : "Liberando"

  return (
    <Button
      type="submit"
      size="icon"
      variant={enabled ? "destructive" : "outline"}
      disabled={pending}
      aria-label={
        pending
          ? `${pendingLabel} ${serviceLabel}`
          : `${actionLabel} ${serviceLabel}`
      }
    >
      {pending ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : enabled ? (
        <LockKeyhole aria-hidden="true" />
      ) : (
        <UnlockKeyhole aria-hidden="true" />
      )}
    </Button>
  )
}
