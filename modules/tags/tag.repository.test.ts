import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({
  firestore: {},
}))

import * as tagRepository from "./tag.repository"

describe("tag repository", () => {
  it("loads the server repository without evaluating a database query", () => {
    expect(tagRepository.completeTagDiscovery).toBeTypeOf("function")
    expect(tagRepository.findActiveTags).toBeTypeOf("function")
    expect(tagRepository.findTagDiscoveriesByParticipant).toBeTypeOf("function")
  })
})
