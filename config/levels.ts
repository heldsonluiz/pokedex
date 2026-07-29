export const LEVELS = [
  { number: 1, title: "Newbie", minimumXp: 0 },
  { number: 2, title: "Aprendiz do Terminal", minimumXp: 100 },
  { number: 3, title: "Caçador de Bugs", minimumXp: 250 },
  { number: 4, title: "Alquimista do Código", minimumXp: 500 },
  { number: 5, title: "Guardião dos Logs", minimumXp: 850 },
  { number: 6, title: "Feiticeiro do Runtime", minimumXp: 1_300 },
  { number: 7, title: "Invocador de Builds", minimumXp: 1_850 },
  { number: 8, title: "Lenda do Commit", minimumXp: 2_500 },
  { number: 9, title: "Arquimago Digital", minimumXp: 3_200 },
  { number: 10, title: "Mestre do Endgame", minimumXp: 4_000 },
] as const

export type Level = (typeof LEVELS)[number]
export const MAX_LEVEL_XP = LEVELS.at(-1)?.minimumXp ?? 0

export function getLevelForXp(xp: number): Level {
  const normalizedXp = Math.max(0, Math.floor(xp))

  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    const level = LEVELS[index]

    if (normalizedXp >= level.minimumXp) {
      return level
    }
  }

  return LEVELS[0]
}

export function getNextLevel(level: Level): Level | null {
  return (
    LEVELS.find((candidate) => candidate.number === level.number + 1) ?? null
  )
}

export function formatLevelLabel(level: Level) {
  return `Nível ${level.number} · ${level.title}`
}
