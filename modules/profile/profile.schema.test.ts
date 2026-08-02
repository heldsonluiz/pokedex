import { describe, expect, it } from "vitest"

import { profileUpdateSchema } from "./profile.schema"

const baseProfile = {
  displayName: "Pessoa Participante",
  gender: "Pessoa não-binária",
  bio: "",
  role: "",
  company: "",
  linkedinUsername: "",
  website: "",
  skills: ["javascript", "typescript", "react"],
}

describe("profile update schema", () => {
  it("requires a gender option", () => {
    expect(
      profileUpdateSchema.safeParse({ ...baseProfile, gender: "" }).success
    ).toBe(false)
  })

  it("accepts only the LinkedIn username", () => {
    expect(
      profileUpdateSchema.safeParse({
        ...baseProfile,
        linkedinUsername: "heldsonluiz",
      }).success
    ).toBe(true)
    expect(
      profileUpdateSchema.safeParse({
        ...baseProfile,
        linkedinUsername: "https://www.linkedin.com/in/heldsonluiz",
      }).success
    ).toBe(false)
  })

  it("adds HTTPS to a website without a protocol", () => {
    const result = profileUpdateSchema.parse({
      ...baseProfile,
      website: "www.meu-website.com",
    })

    expect(result.website).toBe("https://www.meu-website.com")
  })
})
