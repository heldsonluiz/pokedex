import { describe, expect, it } from "vitest"

import { getDatabaseEnvironment } from "./database-environment.mjs"

describe("database script environment selection", () => {
  it("defaults cleanup and seed to the local environment", () => {
    expect(getDatabaseEnvironment({})).toEqual({
      environmentFile: ".env.local",
      environment: "local",
      environmentFlag: "",
    })
  })
  it("keeps explicit local selection in the apply command", () => {
    expect(getDatabaseEnvironment({ local: true })).toEqual({
      environmentFile: ".env.local",
      environment: "local",
      environmentFlag: " --local",
    })
  })
  it("requires production to select .env and preserves it for application", () => {
    expect(getDatabaseEnvironment({ production: true })).toEqual({
      environmentFile: ".env",
      environment: "produção",
      environmentFlag: " --production",
    })
  })
  it("rejects conflicting flags before loading credentials", () => {
    expect(() =>
      getDatabaseEnvironment({ local: true, production: true })
    ).toThrow("Use apenas um")
  })
})
