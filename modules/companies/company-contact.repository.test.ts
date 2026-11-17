import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({
  firestore: {
    collection: (name: string) => ({ doc: (id: string) => ({ name, id }) }),
    runTransaction: async (fn: (t: typeof mocks) => Promise<void>) => fn(mocks),
  },
}))
import { FieldValue } from "firebase-admin/firestore"

import { setCompanyContactConsent } from "./company-contact.repository"
beforeEach(() => vi.clearAllMocks())
it("adds and revokes only the requested company and preserves other profile fields", async () => {
  mocks.get.mockResolvedValue({
    exists: true,
    get: (key: string) => (key === "eventId" ? "event" : undefined),
  })
  await setCompanyContactConsent("event", "person", "one", true)
  expect(mocks.update.mock.calls[0][1].contactCompanyIds).toEqual(
    FieldValue.arrayUnion("one")
  )
  expect(mocks.update.mock.calls[0][1]).not.toHaveProperty("xp")
  await setCompanyContactConsent("event", "person", "one", false)
  expect(mocks.update.mock.calls[1][1].contactCompanyIds).toEqual(
    FieldValue.arrayRemove("one")
  )
})
it("rejects cross-event targets before writing", async () => {
  mocks.get
    .mockResolvedValueOnce({ exists: true, get: () => "event" })
    .mockResolvedValueOnce({ exists: true, get: () => "other" })
  await expect(
    setCompanyContactConsent("event", "person", "one", true)
  ).rejects.toThrow("Invalid contact consent target")
  expect(mocks.update).not.toHaveBeenCalled()
})
