import {
  CheckCircle2,
  LockKeyhole,
  ScanLine,
  Sparkles,
  Tags,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/layout/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
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
      <EmptyState
        icon={<Tags className="size-8" aria-hidden="true" />}
        title="Nenhuma tag disponível"
        description="As tags escondidas aparecerão aqui quando a busca começar."
      />
    )
  }

  const progress = (collection.discoveredCount / collection.totalCount) * 100
  const latestDiscovery = collection.items
    .filter((item) => item.status === "discovered")
    .sort(
      (first, second) =>
        second.discoveredAt.getTime() - first.discoveredAt.getTime()
    )[0]

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Tags escondidas</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Procure os QR Codes espalhados pelo evento e revele toda a coleção.
        </p>
      </section>

      <section className="space-y-2" aria-label="Progresso da coleção">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium">Sua coleção</p>
          <p className="text-muted-foreground tabular-nums">
            {collection.discoveredCount} de {collection.totalCount} encontradas
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Tags encontradas"
          aria-valuemin={0}
          aria-valuemax={collection.totalCount}
          aria-valuenow={collection.discoveredCount}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <TagCollectionHighlight
        latestDiscovery={latestDiscovery ?? null}
        remaining={collection.totalCount - collection.discoveredCount}
      />

      <section className="space-y-3" aria-labelledby="tag-collection-title">
        <h2 id="tag-collection-title" className="text-lg font-semibold">
          Sua coleção
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {collection.items.map((item) => (
            <TagSlot key={item.slot} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}

function TagCollectionHighlight({
  latestDiscovery,
  remaining,
}: Readonly<{
  latestDiscovery: Extract<TagCollectionItem, { status: "discovered" }> | null
  remaining: number
}>) {
  return (
    <section className="overflow-hidden rounded-3xl bg-(image:--gradient-immersive) p-5 text-white shadow-card">
      <div className="flex items-start gap-4">
        {latestDiscovery ? (
          <Avatar className="size-16 shrink-0 rounded-2xl bg-white">
            <AvatarImage
              src={latestDiscovery.imageUrl}
              alt=""
              className="rounded-2xl object-contain"
            />
            <AvatarFallback className="rounded-2xl">TAG</AvatarFallback>
          </Avatar>
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Tags className="size-7" aria-hidden="true" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/65">
            {latestDiscovery ? "Última descoberta" : "Comece a caça"}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {latestDiscovery?.name ?? "Encontre sua primeira tag"}
          </h2>
          <p className="mt-1 text-sm leading-5 text-white/70">
            {remaining === 0
              ? "Você revelou toda a coleção escondida."
              : `${remaining} ${remaining === 1 ? "tag ainda está escondida" : "tags ainda estão escondidas"} pelo evento.`}
          </p>
          {latestDiscovery && (
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/25 px-2.5 py-1 text-xs font-semibold">
              <Sparkles className="size-3.5" aria-hidden="true" />+
              {latestDiscovery.xpAwarded} XP
            </p>
          )}
        </div>
      </div>

      {remaining > 0 && (
        <Link
          href="/scan"
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "mt-5 w-full"
          )}
        >
          <ScanLine data-icon="inline-start" aria-hidden="true" />
          Abrir scanner
        </Link>
      )}
    </section>
  )
}

function TagSlot({ item }: Readonly<{ item: TagCollectionItem }>) {
  if (item.status === "locked") {
    return (
      <article className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <LockKeyhole className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-medium">Tag #{item.slot}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Ainda escondida</p>
        </div>
      </article>
    )
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="relative flex min-h-44 w-full touch-manipulation flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={`Ver detalhes da tag ${item.name}`}
          />
        }
      >
        <CheckCircle2
          className="absolute top-3 right-3 size-4 text-success"
          aria-label="Encontrada"
        />
        <Avatar className="size-16 rounded-2xl">
          <AvatarImage
            src={item.imageUrl}
            alt=""
            className="rounded-2xl object-contain"
          />
          <AvatarFallback className="rounded-2xl">TAG</AvatarFallback>
        </Avatar>

        <span className="min-w-0">
          <span className="line-clamp-2 text-sm font-semibold">
            {item.name}
          </span>
          {item.description && (
            <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {item.description}
            </span>
          )}
        </span>

        <span className="mt-auto text-xs font-medium text-primary">
          +{item.xpAwarded} XP
        </span>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader className="items-center px-8 text-center">
          <Avatar className="size-24 rounded-3xl">
            <AvatarImage
              src={item.imageUrl}
              alt={`Imagem da tag ${item.name}`}
              className="rounded-3xl object-contain"
            />
            <AvatarFallback className="rounded-3xl">TAG</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-xl leading-snug">
            {item.name}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="leading-6 whitespace-pre-wrap">
          {item.description || "Esta tag não possui uma descrição cadastrada."}
        </DialogDescription>

        <p className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
          <Sparkles className="size-4" aria-hidden="true" />+{item.xpAwarded} XP
          conquistados
        </p>
      </DialogContent>
    </Dialog>
  )
}
