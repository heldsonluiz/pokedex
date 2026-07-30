import {
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  MessageSquareText,
  Mic2,
  Sparkles,
  UnlockKeyhole,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/layout/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
      <EmptyState
        icon={<Mic2 className="size-8" aria-hidden="true" />}
        title="Nenhuma palestra disponível"
        description="As palestras do evento aparecerão aqui quando forem publicadas."
      />
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
  const featuredTalk = orderedTalks.find(
    (talk) => talk.evaluationStatus === "open" && !talk.rating
  )
  const progress = Math.round((ratedCount / talks.length) * 100)

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Palestras</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Conheça os conteúdos e avalie as apresentações liberadas.
        </p>
      </section>

      <section className="space-y-2" aria-label="Progresso das avaliações">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium">Suas avaliações</p>
          <p className="text-muted-foreground tabular-nums">
            {ratedCount} de {talks.length} concluídas
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Palestras avaliadas"
          aria-valuemin={0}
          aria-valuemax={talks.length}
          aria-valuenow={ratedCount}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {featuredTalk && <FeaturedTalk talk={featuredTalk} />}

      <section className="space-y-3" aria-labelledby="all-talks-title">
        <h2 id="all-talks-title" className="text-lg font-semibold">
          Todas as palestras
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          {orderedTalks.map((talk) => {
            const status = statusContent[talk.evaluationStatus]
            const StatusIcon = talk.rating ? CheckCircle2 : status.icon
            const firstSpeaker = talk.speakers[0]

            return (
              <Link
                key={talk.id}
                href={`/talks/${encodeURIComponent(talk.id)}`}
                className={cn(
                  "flex min-h-20 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                  talk.rating && "bg-primary/5",
                  talk.evaluationStatus === "closed" &&
                    !talk.rating &&
                    "opacity-70"
                )}
              >
                <Avatar className="size-11">
                  <AvatarImage
                    src={firstSpeaker?.photoUrl ?? undefined}
                    alt={firstSpeaker ? `Foto de ${firstSpeaker.name}` : ""}
                  />
                  <AvatarFallback>
                    <Mic2 aria-hidden="true" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">
                    {talk.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {talk.speakers.length > 0
                      ? talk.speakers.map((speaker) => speaker.name).join(", ")
                      : "Palestrante a confirmar"}
                  </p>
                  {talk.category && (
                    <p className="mt-1 truncate text-xs font-medium text-primary">
                      {talk.category}
                    </p>
                  )}
                </div>

                <span
                  className={cn(
                    "shrink-0",
                    talk.rating
                      ? "text-success"
                      : talk.evaluationStatus === "open"
                        ? "text-primary"
                        : "text-muted-foreground"
                  )}
                >
                  <StatusIcon className="size-4" aria-hidden="true" />
                  <span className="sr-only">
                    {talk.rating ? "Avaliada" : status.label}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function FeaturedTalk({
  talk,
}: Readonly<{
  talk: Awaited<ReturnType<typeof listTalksForSession>>[number]
}>) {
  const firstSpeaker = talk.speakers[0]

  return (
    <section className="space-y-3" aria-labelledby="featured-talk-title">
      <h2
        id="featured-talk-title"
        className="text-sm font-semibold text-muted-foreground"
      >
        Avaliação disponível
      </h2>
      <Link
        href={`/talks/${encodeURIComponent(talk.id)}`}
        className="group block rounded-3xl bg-(image:--gradient-immersive) p-5 text-white shadow-card transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]"
      >
        <div className="flex items-start gap-4">
          <Avatar className="size-16 shrink-0">
            <AvatarImage
              src={firstSpeaker?.photoUrl ?? undefined}
              alt={firstSpeaker ? `Foto de ${firstSpeaker.name}` : ""}
            />
            <AvatarFallback>
              <Mic2 aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/65">
              Conte como foi sua experiência
            </p>
            <h3 className="mt-1 line-clamp-2 font-semibold">{talk.title}</h3>
            <p className="mt-1 truncate text-sm text-white/70">
              {talk.speakers.map((speaker) => speaker.name).join(", ")}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/25 px-2.5 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Ganhe XP avaliando
              </span>
              <ChevronRight
                className="size-5 text-white/70"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
