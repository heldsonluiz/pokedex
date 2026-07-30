import { Crown, Medal, Trophy, UserRound } from "lucide-react"
import type { Metadata } from "next"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import {
  getRankingForSession,
  type RankingEntry,
} from "@/modules/ranking/ranking.service"

export const metadata: Metadata = { title: "Ranking" }
export const dynamic = "force-dynamic"

export default async function RankingPage() {
  const session = await requireAuth()
  const ranking = await getRankingForSession(session)

  if (!ranking.available) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="rounded-full bg-gamification/10 p-4 text-gamification">
          <Trophy className="size-8" aria-hidden="true" />
        </span>
        <div className="max-w-sm space-y-2">
          <h1 className="text-xl font-semibold">Ranking de participantes</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Esta classificação está disponível somente para participantes do
            evento.
          </p>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Classificação do evento
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Participe das atividades e acompanhe sua evolução.
        </p>
      </section>

      <CurrentParticipantCard entry={ranking.current} />

      <RankingSection
        title={ranking.nearby.length === 0 ? "Top 10" : "Top 3"}
        entries={ranking.top}
      />

      {ranking.nearby.length > 0 && (
        <RankingSection title="Sua colocação" entries={ranking.nearby} />
      )}
    </div>
  )
}

function CurrentParticipantCard({
  entry,
}: Readonly<{
  entry: Extract<
    Awaited<ReturnType<typeof getRankingForSession>>,
    { available: true }
  >["current"]
}>) {
  return (
    <section className="overflow-hidden rounded-3xl bg-(image:--gradient-immersive) p-5 text-white shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-white/65">Sua posição</p>
          <p className="mt-1 font-pixel-square text-4xl">#{entry.position}</p>
        </div>
        <div className="text-right">
          <p className="font-pixel-square text-2xl text-gamification tabular-nums">
            {entry.xp} XP
          </p>
          <p className="mt-1 text-xs font-medium text-white/70">
            {entry.levelLabel}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium">
          <span>Progresso total</span>
          <span className="text-white/70 tabular-nums">
            {entry.xp.toLocaleString("pt-BR")} /{" "}
            {entry.maximumLevelXp.toLocaleString("pt-BR")} XP
          </span>
        </div>
        <div
          className="relative h-3 rounded-full bg-white/15 shadow-inner"
          role="progressbar"
          aria-label="Progresso até o nível máximo"
          aria-valuemin={0}
          aria-valuemax={entry.maximumLevelXp}
          aria-valuenow={Math.min(entry.xp, entry.maximumLevelXp)}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gamification transition-[width]"
            style={{
              width: `${entry.journeyProgress}%`,
              backgroundImage: "var(--gradient-gamification)",
            }}
          />
          <span
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gamification shadow-md transition-[left]"
            style={{
              left: `clamp(0.625rem, ${entry.journeyProgress}%, calc(100% - 0.625rem))`,
            }}
            aria-hidden="true"
          />
        </div>
        <p className="mt-2 text-xs font-medium text-white/70">
          {entry.nextLevelLabel
            ? `${entry.xpUntilNextLevel} XP para ${entry.nextLevelLabel}`
            : "Nível máximo alcançado"}
        </p>
      </div>
    </section>
  )
}

function RankingSection({
  title,
  entries,
}: Readonly<{ title: string; entries: RankingEntry[] }>) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ol className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        {entries.map((entry) => (
          <RankingRow key={entry.userId} entry={entry} />
        ))}
      </ol>
    </section>
  )
}

function RankingRow({ entry }: Readonly<{ entry: RankingEntry }>) {
  const podiumStyles = {
    1: "border-l-[#D4AF37] bg-[#FFD700]/12",
    2: "border-l-[#A8B0B8] bg-[#C0C0C0]/12",
    3: "border-l-[#B87333] bg-[#CD7F32]/12",
  }[entry.position]
  const PositionIcon =
    entry.position === 1 ? Crown : entry.position <= 3 ? Medal : null

  return (
    <li
      aria-current={entry.isCurrentParticipant ? "true" : undefined}
      className={cn(
        "flex min-h-18 items-center gap-3 border-l-3 border-transparent px-3 py-3",
        podiumStyles,
        entry.isCurrentParticipant && "border-l-primary bg-primary/8"
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-semibold tabular-nums",
          entry.position === 1 && "bg-[#FFD700]/25 text-[#806600]",
          entry.position === 2 && "bg-[#C0C0C0]/30 text-[#596168]",
          entry.position === 3 && "bg-[#CD7F32]/25 text-[#7A3F16]",
          entry.isCurrentParticipant && "bg-primary text-primary-foreground"
        )}
      >
        {PositionIcon ? (
          <PositionIcon
            className="size-5"
            aria-label={`Posição ${entry.position}`}
          />
        ) : (
          entry.position
        )}
      </div>

      <Avatar className="size-11">
        {entry.avatarUrl && (
          <AvatarImage
            src={entry.avatarUrl}
            alt={`Foto de ${entry.displayName}`}
          />
        )}
        <AvatarFallback>
          <UserRound aria-hidden="true" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{entry.displayName}</p>
          {entry.isCurrentParticipant && (
            <Badge variant="outline" className="border-primary text-primary">
              Você
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {entry.levelLabel}
        </p>
      </div>

      <p className="shrink-0 font-pixel-square text-sm text-gamification tabular-nums">
        {entry.xp} XP
      </p>
    </li>
  )
}
