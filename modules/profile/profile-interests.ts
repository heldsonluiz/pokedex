import * as z from "zod"

export const INTERESTS = [
  { id: "ai", label: "Inteligência artificial" },
  { id: "cloud", label: "Cloud" },
  { id: "web", label: "Desenvolvimento web" },
  { id: "mobile", label: "Mobile" },
  { id: "data", label: "Dados" },
  { id: "security", label: "Segurança" },
  { id: "accessibility", label: "Acessibilidade" },
  { id: "career", label: "Carreira" },
  { id: "open-source", label: "Open source" },
  { id: "entrepreneurship", label: "Empreendedorismo" },
  { id: "design", label: "Design e produto" },
] as const

export const interestsSchema = z
  .array(
    z
      .string()
      .refine(
        (id) => INTERESTS.some((interest) => interest.id === id),
        "Selecione um interesse válido"
      )
  )
  .max(5)
  .refine(
    (items) => new Set(items).size === items.length,
    "Não repita interesses"
  )

export function sharedInterests(
  first: string[] = [],
  second: string[] = []
): string[] {
  return INTERESTS.filter(
    ({ id }) => first.includes(id) && second.includes(id)
  ).map(({ id }) => id)
}
