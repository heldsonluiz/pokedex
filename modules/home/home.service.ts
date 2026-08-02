import "server-only"

import { findActiveCompanies } from "@/modules/companies/company.repository"
import { findActiveMissions } from "@/modules/missions/mission.repository"
import { findActiveTags } from "@/modules/tags/tag.repository"

import type { HomeCatalogTotals } from "./home-progress"

export async function getHomeCatalogTotals(
  eventId: string
): Promise<HomeCatalogTotals> {
  const [companies, missions, tags] = await Promise.all([
    findActiveCompanies(eventId),
    findActiveMissions(eventId),
    findActiveTags(eventId),
  ])

  return {
    companies: companies.length,
    missions: missions.length,
    tags: tags.length,
  }
}
