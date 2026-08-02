"use client"

import { LoaderCircle, Ticket } from "lucide-react"
import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  convertParticipantXpAction,
  convertXpAction,
  type TicketConversionActionState,
} from "./ticket.actions"

const initialState: TicketConversionActionState = { success: false }

export function TicketConversionForm({
  convertibleTickets,
  idempotencyKey,
  participant,
}: Readonly<{
  convertibleTickets: number
  idempotencyKey: string
  participant?: Readonly<{ qrId: string; token: string }>
}>) {
  const [state, formAction, isPending] = useActionState(
    participant ? convertParticipantXpAction : convertXpAction,
    initialState
  )
  const [ticketAmount, setTicketAmount] = useState(String(convertibleTickets))

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {participant && (
        <>
          <input
            type="hidden"
            name="participantQrId"
            value={participant.qrId}
          />
          <input
            type="hidden"
            name="participantToken"
            value={participant.token}
          />
        </>
      )}
      <div className="space-y-1.5">
        <label htmlFor="ticketAmount" className="text-sm font-medium">
          Quantidade de tickets
        </label>
        <Input
          id="ticketAmount"
          name="ticketAmount"
          type="number"
          inputMode="numeric"
          min={1}
          max={convertibleTickets}
          value={ticketAmount}
          onChange={(event) => setTicketAmount(event.target.value)}
          disabled={isPending}
          aria-invalid={Boolean(state.fieldError)}
          aria-describedby={state.fieldError ? "ticketAmount-error" : undefined}
        />
        {state.fieldError && (
          <p id="ticketAmount-error" className="text-xs text-destructive">
            {state.fieldError}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Ticket aria-hidden="true" />
        )}
        Converter XP
      </Button>

      {state.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
