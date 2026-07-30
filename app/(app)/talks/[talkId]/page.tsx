import {
  CheckCircle2,
  LockKeyhole,
  MessageSquareText,
  Mic2,
  Sparkles,
  Star,
} from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAuth } from "@/lib/require-auth"
import { getTalkDetailsForSession } from "@/modules/talks/talk.service"
import { TalkRatingForm } from "@/modules/talks/talk-rating-form"

type TalkDetailsPageProps = Readonly<{
  params: Promise<{ talkId: string }>
}>

export const metadata: Metadata = { title: "Palestra" }
export const dynamic = "force-dynamic"

const formatLabels = {
  talk: "Palestra",
  panel: "Painel",
  keynote: "Keynote",
} as const

export default async function TalkDetailsPage({
  params,
}: TalkDetailsPageProps) {
  const [{ talkId }, session] = await Promise.all([params, requireAuth()])
  const talk = await getTalkDetailsForSession(session, talkId)

  if (!talk) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{formatLabels[talk.format]}</Badge>
          {talk.category && <Badge variant="outline">{talk.category}</Badge>}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{talk.title}</h1>
        <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
          {talk.description}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            {talk.speakers.length > 1 ? "Palestrantes" : "Palestrante"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {talk.speakers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Palestrante a confirmar.
            </p>
          ) : (
            talk.speakers.map((speaker) => (
              <article key={speaker.id} className="flex items-start gap-4">
                <Avatar className="size-16">
                  <AvatarImage
                    src={speaker.photoUrl ?? undefined}
                    alt={`Foto de ${speaker.name}`}
                  />
                  <AvatarFallback>
                    <Mic2 aria-hidden="true" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{speaker.name}</h2>
                  {(speaker.title || speaker.company) && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[speaker.title, speaker.company]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          {talk.rating ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 font-medium text-success">
                <CheckCircle2 className="size-5" aria-hidden="true" />
                Avaliação concluída
              </p>
              <p className="text-sm text-muted-foreground">
                Obrigado pelo feedback. Você recebeu {talk.rating.xpAwarded} XP
                por esta avaliação.
              </p>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["Palestrante", talk.rating.speakerRating],
                  ["Conteúdo", talk.rating.contentRating],
                  ["Acompanhamento", talk.rating.comprehensionRating],
                ].map(([label, score]) => (
                  <div key={label} className="rounded-xl bg-muted p-2.5">
                    <dt className="text-[11px] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 flex items-center justify-center gap-1 font-semibold">
                      <Star
                        className="size-3.5 fill-secondary text-secondary"
                        aria-hidden="true"
                      />
                      {score}/5
                    </dd>
                  </div>
                ))}
              </dl>
              <blockquote className="rounded-xl border-l-4 border-primary bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">
                {talk.rating.comment}
              </blockquote>
            </div>
          ) : talk.evaluationStatus === "open" && talk.canEvaluate ? (
            <div className="space-y-5">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                Complete a avaliação para receber XP.
              </p>
              <TalkRatingForm talkId={talk.id} />
            </div>
          ) : talk.evaluationStatus === "open" ? (
            <div className="flex items-start gap-3">
              <MessageSquareText
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">Avaliação disponível</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Somente contas participantes podem enviar avaliações e receber
                  XP.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {talk.evaluationStatus === "locked" ? (
                <LockKeyhole
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <MessageSquareText
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="font-medium">
                  {talk.evaluationStatus === "locked"
                    ? "Avaliação ainda não liberada"
                    : "Avaliação encerrada"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {talk.evaluationStatus === "locked"
                    ? "A organização avisará quando esta avaliação estiver disponível."
                    : "Esta apresentação não aceita mais avaliações."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
