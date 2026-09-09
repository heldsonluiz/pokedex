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
  xpAwarded: number | null
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
  if (summary.connectionsCount === 0) {
    return {
      type: "connection",
      href: "/scan",
      eyebrow: "Comece por aqui",
      title: "Faça sua primeira conexão",
      description:
        "Converse com alguém e leia o QR Code do perfil dessa pessoa. Os dois ganham XP.",
      xpAwarded: SCORES.PARTICIPANT_CONNECTION,
      actionLabel: "Conhecer alguém",
    }
  }

  const collections = [
    {
      type: "company" as const,
      completed: summary.companiesVisitedCount,
      total: totals.companies,
    },
    {
      type: "tag" as const,
      completed: summary.tagsDiscoveredCount,
      total: totals.tags,
    },
  ]
    .filter(({ completed, total }) => total > 0 && completed < total)
    .sort((a, b) => b.completed / b.total - a.completed / a.total)
  const next = collections[0]

  if (next) {
    const remaining = next.total - next.completed
    return next.type === "company"
      ? {
          type: "company",
          href: "/companies",
          eyebrow: "Continue seu passaporte",
          title:
            remaining === 1
              ? "Falta visitar 1 empresa"
              : `Faltam visitar ${remaining} empresas`,
          description:
            "Conheça um novo estande e leia o QR Code da empresa para registrar a visita.",
          xpAwarded: null,
          actionLabel: "Explorar empresas",
        }
      : {
          type: "tag",
          href: "/tags",
          eyebrow: "Continue sua coleção",
          title:
            remaining === 1
              ? "Falta encontrar 1 tag"
              : `Faltam encontrar ${remaining} tags`,
          description:
            "Procure os QR Codes espalhados pelo evento. Cada descoberta revela uma nova tag.",
          xpAwarded: null,
          actionLabel: "Ver minha coleção",
        }
  }

  if (summary.missionsCompletedCount < totals.missions) {
    return {
      type: "mission",
      href: "/missions",
      eyebrow: "Explore os desafios",
      title: "Confira suas próximas missões",
      description:
        "Veja o progresso e os requisitos de cada desafio. Algumas missões são concluídas automaticamente.",
      xpAwarded: null,
      actionLabel: "Consultar missões",
    }
  }

  return {
    type: "connection",
    href: "/scan",
    eyebrow: "Continue participando",
    title: "Faça uma nova conexão",
    description:
      "Conheça alguém novo: pergunte qual palestra a pessoa mais quer assistir e troquem QR Codes.",
    xpAwarded: SCORES.PARTICIPANT_CONNECTION,
    actionLabel: "Abrir scanner",
  }
}
