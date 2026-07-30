import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Tags,
  Target,
  UsersRound,
} from "lucide-react"
import Link from "next/link"

import type { HomeCatalogTotals } from "@/modules/home/home-progress"

import type { ParticipantSummary } from "./participant-summary.schema"

const summaryItems = [
  {
    field: "connectionsCount",
    label: "Conexões",
    icon: UsersRound,
    href: "/connections",
    totalField: null,
  },
  {
    field: "companiesVisitedCount",
    label: "Empresas",
    icon: Building2,
    href: "/companies",
    totalField: "companies",
  },
  {
    field: "tagsDiscoveredCount",
    label: "Tags",
    icon: Tags,
    href: "/tags",
    totalField: "tags",
  },
  {
    field: "missionsCompletedCount",
    label: "Missões",
    icon: Target,
    href: "/missions",
    totalField: "missions",
  },
] as const

export function ParticipantSummaryCard({
  summary,
  totals,
}: {
  summary: ParticipantSummary
  totals: HomeCatalogTotals
}) {
  return (
    <section className="space-y-3" aria-labelledby="participant-summary-title">
      <h2 id="participant-summary-title" className="text-lg font-semibold">
        Resumo rápido
      </h2>

      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        {summaryItems.map(({ field, label, icon: Icon, href, totalField }) => {
          const total = totalField ? totals[totalField] : null
          const isComplete =
            total !== null && total > 0 && summary[field] >= total

          return (
            <Link
              href={href}
              className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              key={field}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">
                {label}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">
                  {total === null
                    ? summary[field]
                    : `${summary[field]}/${total}`}
                </span>
                {isComplete ? (
                  <CheckCircle2
                    className="size-4 text-success"
                    aria-label="Completo"
                  />
                ) : (
                  <ChevronRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
