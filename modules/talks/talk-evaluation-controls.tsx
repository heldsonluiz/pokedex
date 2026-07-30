"use client"

import {
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  UnlockKeyhole,
} from "lucide-react"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  type TalkEvaluationStatusActionState,
  updateTalkEvaluationStatusAction,
} from "./talk.actions"
import type { TalkEvaluationStatus } from "./talk.schema"

const initialState: TalkEvaluationStatusActionState = { success: false }

const statuses = [
  {
    value: "locked",
    label: "Bloquear",
    icon: LockKeyhole,
    className: "",
  },
  {
    value: "open",
    label: "Liberar",
    icon: UnlockKeyhole,
    className:
      "border-success/40 bg-success/10 text-success hover:bg-success/20 hover:text-success",
  },
  {
    value: "closed",
    label: "Encerrar",
    icon: CheckCircle2,
    className: "",
  },
] as const

export function TalkEvaluationControls({
  talkId,
  currentStatus,
}: Readonly<{
  talkId: string
  currentStatus: TalkEvaluationStatus
}>) {
  const [state, formAction, isPending] = useActionState(
    updateTalkEvaluationStatusAction,
    initialState
  )

  return (
    <div className="space-y-2">
      <form action={formAction} className="grid grid-cols-3 gap-2">
        <input type="hidden" name="talkId" value={talkId} />
        {statuses.map(({ value, label, icon: Icon, className }) => (
          <Button
            key={value}
            type="submit"
            name="evaluationStatus"
            value={value}
            size="sm"
            variant="outline"
            disabled={isPending || currentStatus === value}
            className={cn(className, currentStatus === value && "opacity-100")}
            aria-pressed={currentStatus === value}
          >
            {isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Icon aria-hidden="true" />
            )}
            {label}
          </Button>
        ))}
      </form>

      {state.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success ? "text-xs text-success" : "text-xs text-destructive"
          }
        >
          {state.message}
        </p>
      )}
    </div>
  )
}
