"use client"

import {
  Archive,
  Dices,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  Play,
  UserCheck,
  UserX,
} from "lucide-react"
import { type ReactNode, useActionState } from "react"
import { useFormStatus } from "react-dom"

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
  archiveRaffleSimulationAndNotify,
  beginRaffleClosureAndNotify,
  confirmRaffleWinnerAndNotify,
  drawRaffleAndNotify,
  rerollRaffleAndNotify,
  startRaffleSimulationAndNotify,
  togglePostRaffleRedemptionsAndNotify,
} from "./raffle-live.actions-client"

function RaffleSubmitButton({
  children,
  className,
  variant,
  disabled = false,
}: Readonly<{
  children: ReactNode
  className?: string
  variant?: "default" | "destructive"
  disabled?: boolean
}>) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className={className}
      variant={variant}
      disabled={disabled || pending}
    >
      {pending ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        children
      )}
      {pending && "Processando..."}
    </Button>
  )
}

export function BeginRaffleClosureButton() {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="destructive" />}>
        <LockKeyhole aria-hidden="true" />
        Iniciar fechamento
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Encerrar as operações do evento?</DialogTitle>
          <DialogDescription>
            Esta ação bloqueia imediatamente conversões e resgates. Em seguida,
            será necessário processar todos os participantes para congelar os
            tickets do sorteio. O fechamento não pode ser desfeito pela
            interface.
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
          <form action={beginRaffleClosureAndNotify} className="flex-1">
            <RaffleSubmitButton variant="destructive" className="w-full">
              <LockKeyhole aria-hidden="true" />
              Confirmar
            </RaffleSubmitButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DrawRaffleButton({
  raffleId,
  prizeName,
}: Readonly<{ raffleId: string; prizeName: string }>) {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" size="sm" />}>
        <Dices aria-hidden="true" />
        Sortear
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Sortear {prizeName}?</DialogTitle>
          <DialogDescription>
            Cada ticket congelado representa uma chance. A pessoa selecionada
            precisará ter a presença confirmada antes de se tornar vencedora.
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
          <form action={drawRaffleAndNotify} className="flex-1">
            <input type="hidden" name="raffleId" value={raffleId} />
            <input type="hidden" name="prizeName" value={prizeName} />
            <RaffleSubmitButton className="w-full">
              <Play aria-hidden="true" />
              Confirmar
            </RaffleSubmitButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PostRaffleRedemptionsButton({
  enabled,
}: Readonly<{ enabled: boolean }>) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={enabled ? "destructive" : "outline"}
            className="w-full"
          />
        }
      >
        <LockKeyhole aria-hidden="true" />
        {enabled ? "Encerrar resgates" : "Liberar resgates restantes"}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {enabled
              ? "Encerrar novos resgates?"
              : "Liberar tickets restantes?"}
          </DialogTitle>
          <DialogDescription>
            {enabled
              ? "Os participantes não poderão mais trocar seus saldos por brindes."
              : "Os sorteios permanecerão congelados, mas participantes com saldo poderão voltar a trocá-lo por brindes."}
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
          <form
            action={togglePostRaffleRedemptionsAndNotify}
            className="flex-1"
          >
            <input type="hidden" name="enabled" value={String(!enabled)} />
            <RaffleSubmitButton
              variant={enabled ? "destructive" : "default"}
              className="w-full"
            >
              Confirmar
            </RaffleSubmitButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RaffleCandidateActions({
  raffleId,
  attemptId,
  candidateName,
  prizeName,
}: Readonly<{
  raffleId: string
  attemptId: string
  candidateName: string
  prizeName: string
}>) {
  const [, rerollAction, rerollPending] = useActionState(
    async (_state: null, formData: FormData) => {
      await rerollRaffleAndNotify(formData)
      return null
    },
    null
  )
  const [, confirmAction, confirmPending] = useActionState(
    async (_state: null, formData: FormData) => {
      await confirmRaffleWinnerAndNotify(formData)
      return null
    },
    null
  )
  const candidateActionPending = rerollPending || confirmPending

  return (
    <div className="grid grid-cols-2 gap-2">
      <form action={rerollAction}>
        <input type="hidden" name="raffleId" value={raffleId} />
        <input type="hidden" name="attemptId" value={attemptId} />
        <input type="hidden" name="prizeName" value={prizeName} />
        <RaffleSubmitButton
          className="w-full border-border bg-background text-foreground hover:bg-muted"
          disabled={candidateActionPending}
        >
          <UserX aria-hidden="true" />
          Ausente
        </RaffleSubmitButton>
      </form>

      <Dialog>
        <DialogTrigger
          render={
            <Button
              type="button"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={candidateActionPending}
            />
          }
        >
          <UserCheck aria-hidden="true" />
          Presente
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirmar vencedor?</DialogTitle>
            <DialogDescription>
              Confirme que {candidateName} está presente. A pessoa será
              registrada como vencedora e excluída dos próximos sorteios.
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
            <form action={confirmAction} className="min-w-0 flex-1">
              <input type="hidden" name="raffleId" value={raffleId} />
              <input type="hidden" name="attemptId" value={attemptId} />
              <RaffleSubmitButton
                className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
                disabled={candidateActionPending}
              >
                <UserCheck aria-hidden="true" />
                Confirmar
              </RaffleSubmitButton>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function StartRaffleSimulationButton() {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <FlaskConical aria-hidden="true" />
        Iniciar modo de teste
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Iniciar uma simulação?</DialogTitle>
          <DialogDescription>
            Será criada uma fotografia isolada dos participantes e prêmios.
            Fechamento, sorteios, ausências e consumo de tickets não alterarão
            os dados reais.
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
          <form action={startRaffleSimulationAndNotify} className="flex-1">
            <RaffleSubmitButton className="w-full">
              <FlaskConical aria-hidden="true" />
              Iniciar
            </RaffleSubmitButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ArchiveRaffleSimulationButton({
  label = "Encerrar simulação",
  className,
}: {
  label?: string
  className?: string
} = {}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="destructive" className={className} />
        }
      >
        <Archive aria-hidden="true" />
        {label}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Encerrar o modo de teste?</DialogTitle>
          <DialogDescription>
            A execução será arquivada para auditoria e a Central de operações
            voltará a exibir os dados reais, que não foram alterados.
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
          <form action={archiveRaffleSimulationAndNotify} className="flex-1">
            <RaffleSubmitButton variant="destructive" className="w-full">
              <Archive aria-hidden="true" />
              Encerrar
            </RaffleSubmitButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
