import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({ firestore: {} }))

import * as repository from "./mission.repository"

describe("mission repository", () => {
  it("loads the repository contracts", () => {
    expect(repository.completeMission).toBeTypeOf("function")
    expect(repository.findActiveMissions).toBeTypeOf("function")
    expect(repository.findMissionProgressByParticipant).toBeTypeOf("function")
  })
})
