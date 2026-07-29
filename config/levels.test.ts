import { describe, expect, it } from "vitest"

import { formatLevelLabel, getLevelForXp, getNextLevel, LEVELS } from "./levels"

describe("levels", () => {
  it.each(LEVELS)(
    "starts level $number at $minimumXp XP",
    ({ number, minimumXp }) => {
      expect(getLevelForXp(minimumXp).number).toBe(number)
    }
  )

  it("keeps XP above 4,000 at the maximum level", () => {
    expect(getLevelForXp(4_310).number).toBe(10)
  })

  it("returns the next level and the full interface label", () => {
    const level = getLevelForXp(850)

    expect(formatLevelLabel(level)).toBe("Nível 5 · Guardião dos Logs")
    expect(getNextLevel(level)?.number).toBe(6)
    expect(getNextLevel(LEVELS.at(-1)!)).toBeNull()
  })
})
