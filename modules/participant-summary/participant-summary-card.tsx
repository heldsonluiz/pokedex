import { Building2, Tags, Target, UsersRound } from "lucide-react"

import type { ParticipantSummary } from "./participant-summary.schema"

const summaryItems = [
  {
    field: "connectionsCount",
    label: "Conexões",
    icon: UsersRound,
  },
  {
    field: "companiesVisitedCount",
    label: "Empresas",
    icon: Building2,
  },
  {
    field: "tagsDiscoveredCount",
    label: "Tags",
    icon: Tags,
  },
  {
    field: "missionsCompletedCount",
    label: "Missões",
    icon: Target,
  },
] as const

export function ParticipantSummaryCard({
  summary,
}: {
  summary: ParticipantSummary
}) {
  return (
    <section className="space-y-4" aria-labelledby="participant-summary-title">
      <h2 id="participant-summary-title" className="text-lg font-semibold">
        Seu progresso
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {summaryItems.map(({ field, label, icon: Icon }) => (
          <div
            className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            key={field}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums">{summary[field]}</p>
              <p className="truncate text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
