import { describe, expect, it } from "vitest"

import {
  getProfileInterests,
  INTERESTS,
  interestsSchema,
  sharedInterests,
} from "./profile-interests"

describe("unified profile interests", () => {
  it("merges legacy selections without dropping technologies or duplicating equivalents", () => {
    expect(
      getProfileInterests({
        interests: ["frontend", "cloud"],
        skills: ["front-end", "react", "cloud"],
      })
    ).toEqual(["frontend", "cloud", "react"])
  })

  it("preserves all ten existing selections", () => {
    const areas = getProfileInterests({
      interests: ["ai", "cloud", "career", "security", "design"],
      skills: ["react", "javascript", "typescript", "sql", "python"],
    })
    expect(areas).toHaveLength(10)
    expect(interestsSchema.safeParse(areas).success).toBe(true)
    expect(interestsSchema.safeParse([...areas, "mobile"]).success).toBe(false)
  })

  it("has unique catalogue IDs and rejects invalid or duplicated selections", () => {
    expect(new Set(INTERESTS.map(({ id }) => id)).size).toBe(INTERESTS.length)
    expect(interestsSchema.safeParse(["unknown"]).success).toBe(false)
    expect(interestsSchema.safeParse(["react", "react"]).success).toBe(false)
  })

  it("uses equivalent legacy areas and technologies for new connections", () => {
    expect(
      sharedInterests(getProfileInterests({ skills: ["front-end", "react"] }), [
        "frontend",
        "react",
      ])
    ).toEqual(["frontend", "react"])
  })
})
