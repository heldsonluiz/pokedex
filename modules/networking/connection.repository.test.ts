import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({
  firestore: {},
}))

import * as connectionRepository from "./connection.repository"

describe("connection repository", () => {
  it("loads the repository contract without evaluating a database query", () => {
    expect(connectionRepository.requestConnection).toBeTypeOf("function")
    expect(connectionRepository.removeConnection).toBeTypeOf("function")
  })
})
