import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { getFirestoreCollectionName } from "./firestore-collection"

describe("Firestore collection name", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("keeps the production collection name by default", () => {
    expect(getFirestoreCollectionName("profiles")).toBe("profiles")
  })

  it("prefixes the collection name in development mode", () => {
    vi.stubEnv("DEVMODE", "true")

    expect(getFirestoreCollectionName("profiles")).toBe("test_profiles")
  })
})
