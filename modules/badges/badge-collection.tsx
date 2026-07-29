"use client"

import { Award, LockKeyhole, Sparkles } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { BadgeCollectionItem } from "./badge.service"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
})

export function BadgeCollection({
  items,
}: Readonly<{ items: BadgeCollectionItem[] }>) {
  return (
    <section className="grid grid-cols-3 gap-3" aria-label="Coleção de badges">
      {items.map((item) => (
        <BadgeDialog key={item.id} item={item} />
      ))}
    </section>
  )
}

function BadgeDialog({ item }: Readonly<{ item: BadgeCollectionItem }>) {
  const secret = item.status === "secret"
  const earned = item.status === "earned"
  const name = secret ? "Badge secreta" : item.name

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-center rounded-2xl p-2 transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98]",
              !earned && "opacity-65 grayscale"
            )}
            aria-label={`Ver detalhes: ${name}`}
          />
        }
      >
        <BadgeArtwork item={item} className="size-20" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader className="items-center pt-3 text-center">
          <BadgeArtwork item={item} className="size-28" />
          <DialogTitle className="pt-2 text-xl">{name}</DialogTitle>
          <DialogDescription className="leading-6">
            {secret
              ? "Continue explorando o evento para revelar os detalhes e o critério desta conquista."
              : item.description}
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "rounded-xl p-3 text-center text-sm font-medium",
            earned
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {secret ? (
            <>
              <LockKeyhole
                className="mr-1.5 inline size-4"
                aria-hidden="true"
              />
              Critério secreto
            </>
          ) : earned ? (
            <>
              <Sparkles className="mr-1.5 inline size-4" aria-hidden="true" />
              Conquistada em {dateFormatter.format(item.earnedAt)}
            </>
          ) : (
            item.criterionLabel
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BadgeArtwork({
  item,
  className,
}: Readonly<{ item: BadgeCollectionItem; className?: string }>) {
  if (item.status === "secret") {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          className
        )}
      >
        <LockKeyhole className="size-8" aria-hidden="true" />
      </span>
    )
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={item.imageUrl} alt="" />
      <AvatarFallback>
        <Award className="size-9" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )
}
