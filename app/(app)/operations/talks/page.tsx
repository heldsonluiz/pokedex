import {
  CircleStop,
  Clock3,
  LockKeyhole,
  MapPinned,
  Mic2,
  ShieldCheck,
  UnlockKeyhole,
} from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { EmptyState } from "@/components/layout/empty-state"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { listManageableTalksForSession } from "@/modules/talks/talk.service"
import { TalkEvaluationControls } from "@/modules/talks/talk-evaluation-controls"

export const metadata: Metadata = { title: "Avaliações de palestras" }
export const dynamic = "force-dynamic"

export default async function TalkOperationsPage() {
  const session = await requireAuth()
  const talks = await listManageableTalksForSession(session)

  if (!talks) {
    notFound()
  }

  const orderedTalks = talks.toSorted(
    (first, second) =>
      Number(first.evaluationStatus === "closed") -
        Number(second.evaluationStatus === "closed") ||
      first.title.localeCompare(second.title, "pt-BR")
  )

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <Badge variant="secondary">
          <ShieldCheck aria-hidden="true" />
          Área administrativa
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">
          Avaliações de palestras
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Libere, bloqueie ou encerre individualmente cada avaliação.
        </p>
      </section>

      {orderedTalks.length === 0 ? (
        <EmptyState
          className="min-h-72 py-6"
          icon={<Mic2 className="size-8" aria-hidden="true" />}
          title="Nenhuma palestra ativa"
          description="As palestras aparecerão aqui quando forem cadastradas."
          headingLevel="h2"
        />
      ) : (
        <section className="space-y-3" aria-label="Palestras para administrar">
          {orderedTalks.map((talk) => (
            <article
              key={talk.id}
              className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    talk.evaluationStatus === "open"
                      ? "bg-success/15 text-success"
                      : talk.evaluationStatus === "locked"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                        : "bg-destructive/15 text-destructive"
                  )}
                >
                  {talk.evaluationStatus === "open" ? (
                    <UnlockKeyhole className="size-5" aria-hidden="true" />
                  ) : talk.evaluationStatus === "locked" ? (
                    <LockKeyhole className="size-5" aria-hidden="true" />
                  ) : (
                    <CircleStop className="size-5" aria-hidden="true" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{talk.title}</h2>
                    <Badge
                      variant="outline"
                      className={
                        talk.evaluationStatus === "locked"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : talk.evaluationStatus === "open"
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-destructive/40 bg-destructive/10 text-destructive"
                      }
                    >
                      {talk.evaluationStatus === "locked" && "Bloqueada"}
                      {talk.evaluationStatus === "open" && "Disponível"}
                      {talk.evaluationStatus === "closed" && "Encerrada"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {talk.speakers.length > 0
                      ? talk.speakers.map((speaker) => speaker.name).join(", ")
                      : "Palestrante a confirmar"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                  <MapPinned className="size-4 shrink-0" aria-hidden="true" />
                  <span>Trilha a definir</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                  <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                  <span>Horário a definir</span>
                </div>
              </div>

              <TalkEvaluationControls
                talkId={talk.id}
                currentStatus={talk.evaluationStatus}
              />
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
