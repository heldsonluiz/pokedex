import {
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  MessageSquareText,
  Mic2,
  UnlockKeyhole,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { listTalksForSession } from "@/modules/talks/talk.service"

export const metadata: Metadata = { title: "Palestras" }
export const dynamic = "force-dynamic"

const statusContent = {
  locked: {
    label: "Avaliação bloqueada",
    icon: LockKeyhole,
    className: "text-muted-foreground",
  },
  open: {
    label: "Avaliação disponível",
    icon: UnlockKeyhole,
    className: "border-success/40 bg-success/10 text-success",
  },
  closed: {
    label: "Avaliação encerrada",
    icon: MessageSquareText,
    className: "text-muted-foreground",
  },
} as const

export default async function TalksPage() {
  const session = await requireAuth()
  const talks = await listTalksForSession(session)

  if (talks.length === 0) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="rounded-full bg-primary/10 p-4 text-primary">
          <Mic2 className="size-8" aria-hidden="true" />
        </span>
        <div className="max-w-sm space-y-2">
          <h1 className="text-xl font-semibold">Nenhuma palestra disponível</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            As palestras do evento aparecerão aqui quando forem publicadas.
          </p>
        </div>
      </section>
    )
  }

  const ratedCount = talks.filter((talk) => talk.rating).length
  const orderedTalks = talks.toSorted(
    (first, second) =>
      Number(Boolean(first.rating) || first.evaluationStatus === "closed") -
        Number(
          Boolean(second.rating) || second.evaluationStatus === "closed"
        ) || first.title.localeCompare(second.title, "pt-BR")
  )

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Palestras</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Conheça os conteúdos e avalie as apresentações liberadas.
        </p>
        <p className="text-sm font-medium text-primary">
          {ratedCount} de {talks.length} palestras avaliadas
        </p>
      </section>

      <section className="space-y-3" aria-label="Palestras do evento">
        {orderedTalks.map((talk) => {
          const status = statusContent[talk.evaluationStatus]
          const StatusIcon = talk.rating ? CheckCircle2 : status.icon
          const firstSpeaker = talk.speakers[0]

          return (
            <Link
              key={talk.id}
              href={`/talks/${encodeURIComponent(talk.id)}`}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Avatar className="size-14">
                <AvatarImage
                  src={firstSpeaker?.photoUrl ?? undefined}
                  alt={firstSpeaker ? `Foto de ${firstSpeaker.name}` : ""}
                />
                <AvatarFallback>
                  <Mic2 aria-hidden="true" />
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  {talk.category && (
                    <Badge className="border-transparent bg-(image:--gradient-primary-card) text-primary-foreground">
                      {talk.category}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      talk.rating
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : status.className
                    )}
                  >
                    <StatusIcon aria-hidden="true" />
                    {talk.rating ? "Avaliada" : status.label}
                  </Badge>
                </div>
                <h2 className="mt-2 font-semibold">{talk.title}</h2>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {talk.speakers.length > 0
                    ? talk.speakers.map((speaker) => speaker.name).join(", ")
                    : "Palestrante a confirmar"}
                </p>
              </div>

              <ChevronRight
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          )
        })}
      </section>
    </div>
  )
}
