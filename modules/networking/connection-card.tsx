"use client"

import { LoaderCircle, Mail, UserMinus } from "lucide-react"
import { useActionState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  type ConnectionMutationActionState,
  mutateConnectionAction,
} from "./connection.actions"
import type { ConnectionListItem } from "./connection.service"

const INITIAL_STATE: ConnectionMutationActionState = {
  success: false,
}

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export function ConnectionCard({
  connection,
}: Readonly<{ connection: ConnectionListItem }>) {
  const [state, formAction, isPending] = useActionState(
    mutateConnectionAction,
    INITIAL_STATE
  )
  const { participant } = connection

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar>
            {participant.avatarUrl && (
              <AvatarImage
                src={participant.avatarUrl}
                alt={`Foto de ${participant.displayName}`}
              />
            )}
            <AvatarFallback>
              {getInitials(participant.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">
              {participant.displayName}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {[participant.role, participant.company]
                .filter(Boolean)
                .join(" · ") || "Participante"}
            </p>
          </div>

          <ConnectionRemovalDialog
            connectionId={connection.id}
            participantName={participant.displayName}
            formAction={formAction}
            isPending={isPending}
          />
        </div>

        {participant.email && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{participant.email}</span>
          </p>
        )}

        {state.message && (
          <p
            className={
              state.success
                ? "text-sm text-success"
                : "text-sm text-destructive"
            }
            role={state.success ? "status" : "alert"}
          >
            {state.message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ConnectionRemovalDialog({
  connectionId,
  participantName,
  formAction,
  isPending,
}: Readonly<{
  connectionId: string
  participantName: string
  formAction: (formData: FormData) => void
  isPending: boolean
}>) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20"
            aria-label={`Remover conexão com ${participantName}`}
          />
        }
      >
        <UserMinus aria-hidden="true" />
      </DialogTrigger>

      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Remover conexão?</DialogTitle>
          <DialogDescription>
            Você e {participantName} deixarão de ser conexões e perderão a XP
            recebida por essa conexão.
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
            <input type="hidden" name="connectionId" value={connectionId} />
            <input type="hidden" name="intent" value="remove" />
            <Button
              type="submit"
              variant="destructive"
              className="w-full bg-destructive/20 text-destructive hover:bg-destructive/30"
              disabled={isPending}
            >
              {isPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <UserMinus aria-hidden="true" />
              )}
              Remover
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
