import { type Skill, skills } from "@/data/skills"

const skillBySlug = new Map<string, Skill>(
  skills.map((skill) => [skill.slug, skill])
)

function normalizeSearchTerm(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("pt-BR")
}

export function findSkillBySlug(slug: string) {
  return skillBySlug.get(slug)
}

export function isValidSkillSlug(slug: string) {
  return skillBySlug.has(slug)
}

export function searchSkills(
  query: string,
  excludedSlugs: readonly string[] = []
) {
  const normalizedQuery = normalizeSearchTerm(query)

  if (!normalizedQuery) {
    return []
  }

  const excluded = new Set(excludedSlugs)

  return skills.filter((skill) => {
    if (excluded.has(skill.slug)) {
      return false
    }

    return [skill.name, ...skill.aliases].some((term) =>
      normalizeSearchTerm(term).includes(normalizedQuery)
    )
  })
}
