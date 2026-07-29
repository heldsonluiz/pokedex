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
import type { ReactNode } from "react"
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
}: Readonly<{
  children: ReactNode
  className?: string
  variant?: "default" | "destructive"
}>) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className={className}
      variant={variant}
      disabled={pending}
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
}: Readonly<{ raffleId: string; attemptId: string; candidateName: string }>) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Dialog>
        <DialogTrigger
          render={<Button type="button" variant="outline" className="w-full" />}
        >
          <UserX aria-hidden="true" />
          Ausente
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Sortear outra pessoa?</DialogTitle>
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-center font-heading text-base font-semibold text-primary">
              {candidateName}
            </p>
            <DialogDescription>
              Essa pessoa será marcada como ausente somente neste prêmio e
              continuará elegível nos próximos sorteios.
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
            <form action={rerollRaffleAndNotify} className="min-w-0 flex-1">
              <input type="hidden" name="raffleId" value={raffleId} />
              <input type="hidden" name="attemptId" value={attemptId} />
              <RaffleSubmitButton className="w-full">
                <Dices aria-hidden="true" />
                Sortear
              </RaffleSubmitButton>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger render={<Button type="button" className="w-full" />}>
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
            <form
              action={confirmRaffleWinnerAndNotify}
              className="min-w-0 flex-1"
            >
              <input type="hidden" name="raffleId" value={raffleId} />
              <input type="hidden" name="attemptId" value={attemptId} />
              <RaffleSubmitButton className="w-full">
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

export function ArchiveRaffleSimulationButton() {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="destructive" />}>
        <Archive aria-hidden="true" />
        Encerrar simulação
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
