import { SCORES } from "@/config/scores"
import type { ParticipantSummary } from "@/modules/participant-summary/participant-summary.schema"

export type HomeCatalogTotals = Readonly<{
  companies: number
  missions: number
  tags: number
}>

export type HomeObjective = Readonly<{
  type: "company" | "mission" | "tag" | "connection"
  href: "/companies" | "/missions" | "/tags" | "/scan"
  eyebrow: string
  title: string
  description: string
  xpAwarded: number
  actionLabel: string
}>

export function calculatePassportProgress(
  summary: ParticipantSummary,
  totals: HomeCatalogTotals
) {
  const recordedCompletions =
    summary.companiesVisitedCount +
    summary.missionsCompletedCount +
    summary.tagsDiscoveredCount
  const total = totals.companies + totals.missions + totals.tags
  const completed = Math.min(recordedCompletions, total)
  const percentage =
    total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))

  return { completed, total, percentage }
}

export function selectHomeObjective(
  summary: ParticipantSummary,
  totals: HomeCatalogTotals
): HomeObjective {
  if (summary.companiesVisitedCount < totals.companies) {
    return {
      type: "company",
      href: "/companies",
      eyebrow: "Próxima atividade",
      title: "Visite um novo estande",
      description:
        "Conheça as empresas participantes e encontre seus QR Codes.",
      xpAwarded: SCORES.COMPANY_VISIT,
      actionLabel: "Explorar empresas",
    }
  }

  if (summary.missionsCompletedCount < totals.missions) {
    return {
      type: "mission",
      href: "/missions",
      eyebrow: "Próximo desafio",
      title: "Complete uma missão",
      description: "Confira os desafios disponíveis e avance na sua jornada.",
      xpAwarded: SCORES.MISSION_COMPLETION,
      actionLabel: "Ver missões",
    }
  }

  if (summary.tagsDiscoveredCount < totals.tags) {
    return {
      type: "tag",
      href: "/tags",
      eyebrow: "Continue explorando",
      title: "Encontre uma tag escondida",
      description: "Procure os QR Codes secretos espalhados pelo evento.",
      xpAwarded: SCORES.TAG_DISCOVERY,
      actionLabel: "Ver coleção",
    }
  }

  return {
    type: "connection",
    href: "/scan",
    eyebrow: "Jornada em dia",
    title: "Faça uma nova conexão",
    description: "Use o scanner para conhecer outro participante do evento.",
    xpAwarded: SCORES.PARTICIPANT_CONNECTION,
    actionLabel: "Abrir scanner",
  }
}
