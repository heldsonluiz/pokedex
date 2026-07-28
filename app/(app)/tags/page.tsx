import { LockKeyhole, Tags } from "lucide-react"
import type { Metadata } from "next"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { requireAuth } from "@/lib/require-auth"
import {
  listTagsForSession,
  type TagCollectionItem,
} from "@/modules/tags/tag.service"

export const metadata: Metadata = {
  title: "Tags",
}

export const dynamic = "force-dynamic"

export default async function TagsPage() {
  const session = await requireAuth()
  const collection = await listTagsForSession(session)

  if (collection.totalCount === 0) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="rounded-full bg-primary/10 p-4 text-primary">
          <Tags className="size-8" aria-hidden="true" />
        </span>
        <div className="max-w-sm space-y-2">
          <h1 className="text-xl font-semibold">Nenhuma tag disponível</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            As tags escondidas aparecerão aqui quando a busca começar.
          </p>
        </div>
      </section>
    )
  }

  const progress = (collection.discoveredCount / collection.totalCount) * 100

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Tags escondidas</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Procure os QR Codes espalhados pelo evento e revele toda a coleção.
          </p>
        </div>

        <Progress value={progress}>
          <ProgressLabel>Progresso</ProgressLabel>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {collection.discoveredCount} de {collection.totalCount}
          </span>
        </Progress>
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="Coleção de tags">
        {collection.items.map((item) => (
          <TagSlot key={item.slot} item={item} />
        ))}
      </section>
    </div>
  )
}

function TagSlot({ item }: Readonly<{ item: TagCollectionItem }>) {
  if (item.status === "locked") {
    return (
      <article className="flex min-h-52 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <LockKeyhole className="size-7" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-medium">Tag não encontrada</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Continue procurando pelo evento.
          </p>
        </div>
      </article>
    )
  }

  return (
    <article className="flex min-h-52 flex-col items-center gap-3 rounded-2xl bg-card p-4 text-center ring-1 ring-foreground/10">
      <Avatar className="size-20 rounded-2xl">
        <AvatarImage
          src={item.imageUrl}
          alt={`Imagem da tag ${item.name}`}
          className="rounded-2xl object-contain"
        />
        <AvatarFallback className="rounded-2xl">TAG</AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <h2 className="font-semibold">{item.name}</h2>
        {item.description && (
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>

      <p className="mt-auto text-xs font-medium text-primary">
        +{item.xpAwarded} XP
      </p>
    </article>
  )
}
