import { Award } from "lucide-react"
import type { Metadata } from "next"

import { Progress, ProgressLabel } from "@/components/ui/progress"
import { requireAuth } from "@/lib/require-auth"
import { getBadgesForSession } from "@/modules/badges/badge.service"
import { BadgeCollection } from "@/modules/badges/badge-collection"

export const metadata: Metadata = { title: "Badges" }
export const dynamic = "force-dynamic"

export default async function BadgesPage() {
  const session = await requireAuth()
  const collection = await getBadgesForSession(session)

  if (!collection.available) {
    return (
      <EmptyBadges
        title="Badges de participantes"
        description="Esta coleção está disponível somente para participantes do evento."
      />
    )
  }

  if (collection.totalCount === 0) {
    return (
      <EmptyBadges
        title="Nenhuma badge disponível"
        description="As conquistas aparecerão aqui quando forem liberadas."
      />
    )
  }

  const progress = (collection.earnedCount / collection.totalCount) * 100

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Suas conquistas</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Complete atividades e descubra badges especiais.
          </p>
        </div>

        <Progress value={progress}>
          <ProgressLabel>Progresso</ProgressLabel>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {collection.earnedCount} de {collection.totalCount}
          </span>
        </Progress>
      </section>

      <BadgeCollection items={collection.items} />
    </div>
  )
}

function EmptyBadges({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="rounded-full bg-primary/10 p-4 text-primary">
        <Award className="size-8" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  )
}
