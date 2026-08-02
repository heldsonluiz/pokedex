"use client"

import { ChevronRight, LoaderCircle, UserMinus } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
    <article className="px-4 py-3">
      <div className="flex min-h-14 items-center gap-3">
        <Link
          href={`/connections/${encodeURIComponent(connection.id)}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={`Abrir perfil de ${participant.displayName}`}
        >
          <Avatar className="size-11">
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

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {participant.displayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {[participant.role, participant.company]
                .filter(Boolean)
                .join(" · ") || "Participante"}
            </span>
            {participant.email && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {participant.email}
              </span>
            )}
          </span>

          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </Link>

        <ConnectionRemovalDialog
          connectionId={connection.id}
          participantName={participant.displayName}
          formAction={formAction}
          isPending={isPending}
        />
      </div>

      {state.message && (
        <p
          className={
            state.success
              ? "mt-2 text-xs text-success"
              : "mt-2 text-xs text-destructive"
          }
          role={state.success ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </article>
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
            className="size-10 border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20"
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
