import { beforeEach, describe, expect, it, vi } from "vitest"

const mock = vi.hoisted(() => ({
  documents: new Map<string, unknown>(),
  tail: Promise.resolve(),
  increments: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/modules/participant-summary/participant-summary.repository", () => ({
  incrementParticipantSummary: mock.increments,
  getParticipantSummaryRef: () => ({ path: "summaries/user-1", id: "user-1" }),
}))
vi.mock("@/lib/firebase/admin", () => {
  const ref = (collection: string, id: string) => ({
    path: `${collection}/${id}`,
    id,
    get: async () => snapshot(`${collection}/${id}`, id),
  })
  const snapshot = (path: string, id: string) => ({
    id,
    exists: mock.documents.has(path),
    data: () => mock.documents.get(path),
  })
  return {
    firestore: {
      collection: (name: string) => ({
        doc: (id: string) => ref(name, id),
        where: () => ({ query: true, collection: name }),
      }),
      runTransaction: (
        callback: (transaction: unknown) => Promise<unknown>
      ) => {
        const run = mock.tail.then(async () => {
          const writes: (() => void)[] = []
          const result = await callback({
            get: async (reference: {
              path: string
              id: string
              query?: boolean
              collection?: string
            }) =>
              reference.query
                ? {
                    docs: [...mock.documents.entries()]
                      .filter(([path]) =>
                        path.startsWith(`${reference.collection}/`)
                      )
                      .map(([path, data]) => ({ id: path, data: () => data })),
                  }
                : snapshot(reference.path, reference.id),
            set: (reference: { path: string }, value: unknown) =>
              writes.push(() => mock.documents.set(reference.path, value)),
            create: (reference: { path: string }, value: unknown) =>
              writes.push(() => {
                if (mock.documents.has(reference.path))
                  throw new Error("Duplicate")
                mock.documents.set(reference.path, value)
              }),
            update: (reference: { path: string }, value: object) =>
              writes.push(() =>
                mock.documents.set(reference.path, {
                  ...(mock.documents.get(reference.path) as object),
                  ...value,
                })
              ),
          })
          writes.forEach((write) => write())
          return result
        })
        mock.tail = run.then(() => undefined)
        return run
      },
    },
  }
})

import { completeEligibleAutomaticMissions } from "./mission.repository"
import { missionFieldsSchema } from "./mission.schema"

const mission = missionFieldsSchema.parse({
  id: "networking-1",
  eventId: "event-1",
  title: "Conheça pessoas",
  description: "Encontre interesses em comum.",
  qrId: null,
  imageUrl: null,
  validationType: "automatic",
  progressRequirement: { type: "shared-interests", target: 1 },
  active: true,
  order: 0,
  xpAwarded: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
})
const input = {
  eventId: "event-1",
  participantId: "user-1",
  missions: [mission],
  activeCompanyCount: 0,
  defaultXpAwarded: 100,
}
beforeEach(() => {
  mock.documents.clear()
  mock.tail = Promise.resolve()
  mock.documents.set("profiles/user-1", {
    userId: "user-1",
    eventId: "event-1",
    onboardingCompleted: true,
    accessRoles: ["participant"],
    xp: 10,
  })
  mock.documents.set("summaries/user-1", {
    participantId: "user-1",
    eventId: "event-1",
    connectionsCount: 100,
  })
  mock.documents.set("connections/pair-1", {
    eventId: "event-1",
    participantIds: ["user-1", "user-2"],
    status: "accepted",
    sharedInterests: ["ai"],
  })
})
describe("networking mission transaction", () => {
  it("awards once with simultaneous evaluations", async () => {
    expect(
      await Promise.all([
        completeEligibleAutomaticMissions(input),
        completeEligibleAutomaticMissions(input),
      ])
    ).toEqual([1, 0])
    expect(mock.documents.get("profiles/user-1")).toMatchObject({ xp: 60 })
  })
  it("checks recorded connections rather than the total connection counter", async () => {
    mock.documents.set("connections/pair-1", {
      eventId: "event-1",
      participantIds: ["user-1", "user-2"],
      status: "accepted",
    })
    expect(await completeEligibleAutomaticMissions(input)).toBe(0)
    expect(mock.documents.get("profiles/user-1")).toMatchObject({ xp: 10 })
  })
  it("does not award when a connection is removed before evaluation", async () => {
    mock.documents.set("connections/pair-1", {
      eventId: "event-1",
      participantIds: ["user-1", "user-2"],
      status: "removed",
      sharedInterests: ["ai"],
    })
    expect(await completeEligibleAutomaticMissions(input)).toBe(0)
  })
  it("preserves earned missions when a connection is later removed", async () => {
    expect(await completeEligibleAutomaticMissions(input)).toBe(1)
    mock.documents.delete("connections/pair-1")
    expect(await completeEligibleAutomaticMissions(input)).toBe(0)
    expect(mock.documents.get("profiles/user-1")).toMatchObject({ xp: 60 })
  })
})
