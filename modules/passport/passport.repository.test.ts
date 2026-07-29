import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({ firestore: {} }))

import * as repository from "./passport.repository"

describe("passport repository", () => {
  it("loads the read-only completion repository", () => {
    expect(repository.findPassportCompletions).toBeTypeOf("function")
  })
})
