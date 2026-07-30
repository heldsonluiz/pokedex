"use client"

import { Gift, LoaderCircle } from "lucide-react"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  redeemRewardAction,
  type RewardRedemptionActionState,
} from "./reward.actions"

const initialState: RewardRedemptionActionState = { success: false }

export function RewardRedemptionButton({
  reward,
  participantQrId,
  participantToken,
  idempotencyKey,
}: Readonly<{
  reward: Readonly<{ id: string; name: string; ticketCost: number }>
  participantQrId: string
  participantToken: string
  idempotencyKey: string
}>) {
  const [state, formAction, isPending] = useActionState(
    redeemRewardAction,
    initialState
  )

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" size="sm" />}>
        <Gift aria-hidden="true" />
        Resgatar
      </DialogTrigger>

      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirmar entrega?</DialogTitle>
          <DialogDescription>
            Entregue {reward.name} ao participante e consuma {reward.ticketCost}{" "}
            {reward.ticketCost === 1 ? "ticket" : "tickets"}.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row">
          <DialogClose
            render={
              <Button type="button" variant="outline" className="flex-1" />
            }
          >
            Cancelar
          </DialogClose>

          <form action={formAction} className="flex-1">
            <input type="hidden" name="rewardId" value={reward.id} />
            <input
              type="hidden"
              name="participantQrId"
              value={participantQrId}
            />
            <input
              type="hidden"
              name="participantToken"
              value={participantToken}
            />
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Gift aria-hidden="true" />
              )}
              Confirmar
            </Button>
          </form>
        </DialogFooter>

        {state.message && (
          <p
            role={state.success ? "status" : "alert"}
            className={
              state.success
                ? "text-sm text-success"
                : "text-sm text-destructive"
            }
          >
            {state.message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
