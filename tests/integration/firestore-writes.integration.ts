import { createHash, randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import { performance } from "node:perf_hooks"

import { type Firestore, Timestamp } from "firebase-admin/firestore"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type * as CompanyRepository from "@/modules/companies/company.repository"
import type * as MissionRepository from "@/modules/missions/mission.repository"
import type * as ConnectionRepository from "@/modules/networking/connection.repository"
import type * as TagRepository from "@/modules/tags/tag.repository"
import type * as TicketRepository from "@/modules/tickets/ticket.repository"

if (
  process.env.RUN_FIRESTORE_INTEGRATION !== "true" ||
  process.env.DEVMODE?.trim().toLowerCase() !== "true"
) {
  throw new Error(
    "Requires RUN_FIRESTORE_INTEGRATION=true and DEVMODE=true; real test Firestore writes are opt-in"
  )
}

const runId = `perf-write-${randomUUID()}`
const eventId = runId
const hash = (parts: string[]) =>
  createHash("sha256").update(JSON.stringify(parts)).digest("hex")
const ids = Array.from({ length: 54 }, (_, i) => `${runId}-${i}`)
const companyQr = randomUUID()
const tagQr = randomUUID()
const missionQr = randomUUID()
const collections = [
  "profiles",
  "participantSummaries",
  "companies",
  "tags",
  "missions",
  "activityCompletions",
  "connections",
  "ticketTransactions",
]
let firestore: Firestore
let company: typeof CompanyRepository
let tag: typeof TagRepository
let mission: typeof MissionRepository
let connection: typeof ConnectionRepository
let ticket: typeof TicketRepository
const report: {
  runId: string
  startedAt: string
  groups: unknown[]
  checks: string[]
  cleanup?: string
  deletedDocuments?: number
  finishedAt?: string
} = { runId, startedAt: new Date().toISOString(), groups: [], checks: [] }
const col = (name: string) => firestore.collection(`test_${name}`)

async function batch(label: string, calls: Array<() => Promise<unknown>>) {
  const started = performance.now()
  const results = await Promise.all(
    calls.map(async (call) => {
      const start = performance.now()
      try {
        const value = await call()
        const status =
          typeof value === "string"
            ? value
            : typeof value === "object" && value !== null && "status" in value
              ? String(value.status)
              : "unknown"
        return {
          status,
          ms: Math.round(performance.now() - start),
          error: false,
        }
      } catch (error) {
        return {
          status:
            error && typeof error === "object" && "code" in error
              ? `error-${String(error.code)}`
              : "error",
          ms: Math.round(performance.now() - start),
          error: true,
        }
      }
    })
  )
  const times = results.map((r) => r.ms).sort((a, b) => a - b)
  const stats = {
    label,
    operations: calls.length,
    errors: results.filter((r) => r.error).length,
    durationMs: Math.round(performance.now() - started),
    p50Ms: times[Math.ceil(times.length * 0.5) - 1],
    p95Ms: times[Math.ceil(times.length * 0.95) - 1],
    maxMs: times.at(-1),
    statuses: Object.fromEntries(
      [...new Set(results.map((r) => r.status))].map((status) => [
        status,
        results.filter((r) => r.status === status).length,
      ])
    ),
  }
  report.groups.push(stats)
  console.log(JSON.stringify(stats))
  expect(stats.errors, label).toBe(0)
  return results.map((r) => r.status)
}
const visit = (id: string) =>
  company.completeCompanyVisit({
    eventId,
    participantId: id,
    qrId: companyQr,
    defaultXpAwarded: 50,
  })
const discover = (id: string) =>
  tag.completeTagDiscovery({
    eventId,
    participantId: id,
    qrId: tagQr,
    defaultXpAwarded: 75,
  })
const complete = (id: string) =>
  mission.completeMission({
    eventId,
    participantId: id,
    qrId: missionQr,
    validationType: "qr",
    defaultXpAwarded: 50,
  })
const connect = (a: string, b: string) =>
  connection.requestConnection({
    eventId,
    requesterId: a,
    recipientId: b,
    xpAwardedPerParticipant: 5,
  })

async function verifyProfile(
  id: string,
  xp: number,
  counters: Record<string, number>
) {
  const [profile, summary] = await Promise.all([
    col("profiles").doc(id).get(),
    col("participantSummaries")
      .doc(hash([eventId, id, "summary"]))
      .get(),
  ])
  expect(profile.data()?.xp).toBe(xp)
  expect(summary.data()).toMatchObject(counters)
}

beforeAll(async () => {
  firestore = (await import("@/lib/firebase/admin")).firestore
  ;[company, tag, mission, connection, ticket] = await Promise.all([
    import("@/modules/companies/company.repository"),
    import("@/modules/tags/tag.repository"),
    import("@/modules/missions/mission.repository"),
    import("@/modules/networking/connection.repository"),
    import("@/modules/tickets/ticket.repository"),
  ])
  await writeFile(
    `/tmp/${runId}-cleanup.json`,
    JSON.stringify({
      eventId,
      collections: collections.map((name) => `test_${name}`),
    }),
    { mode: 0o600 }
  )
  const now = Timestamp.now()
  const seed = firestore.batch()
  for (const [i, id] of ids.entries()) {
    seed.create(col("profiles").doc(id), {
      userId: id,
      eventId,
      displayName: `Write Test ${i}`,
      email: `${id}@example.test`,
      avatarUrl: null,
      onboardingCompleted: true,
      accessRoles: ["participant"],
      xp: i >= 52 ? 500 : 0,
      xpReachedAt: now,
      ticketBalance: 0,
      convertedXp: 0,
      onboardingTicketGranted: false,
      createdAt: now,
      updatedAt: now,
    })
    seed.create(
      col("participantSummaries").doc(hash([eventId, id, "summary"])),
      {
        eventId,
        participantId: id,
        connectionsCount: 0,
        companiesVisitedCount: 0,
        tagsDiscoveredCount: 0,
        missionsCompletedCount: 0,
        initializedAt: now,
        updatedAt: now,
      }
    )
  }
  seed.create(col("companies").doc(runId), {
    eventId,
    qrId: companyQr,
    name: "Temporary company",
    description: null,
    logoUrl: "https://example.test/company.png",
    stampImageUrl: null,
    active: true,
    xpAwarded: 50,
    createdAt: now,
    updatedAt: now,
  })
  seed.create(col("tags").doc(runId), {
    eventId,
    qrId: tagQr,
    name: "Temporary tag",
    description: "Integration fixture",
    imageUrl: "https://example.test/tag.png",
    active: true,
    order: 0,
    xpAwarded: 75,
    createdAt: now,
    updatedAt: now,
  })
  seed.create(col("missions").doc(runId), {
    eventId,
    qrId: missionQr,
    title: "Temporary mission",
    description: "Integration fixture",
    imageUrl: null,
    validationType: "qr",
    progressRequirement: null,
    prerequisites: [],
    active: true,
    order: 0,
    xpAwarded: 50,
    createdAt: now,
    updatedAt: now,
  })
  await seed.commit()
}, 180_000)

afterAll(async () => {
  if (!firestore) return
  try {
    let deleted = 0
    for (const name of collections) {
      const snapshots = await col(name).where("eventId", "==", eventId).get()
      for (let offset = 0; offset < snapshots.docs.length; offset += 400) {
        const cleanup = firestore.batch()
        for (const doc of snapshots.docs.slice(offset, offset + 400))
          cleanup.delete(doc.ref)
        await cleanup.commit()
        deleted += Math.min(400, snapshots.docs.length - offset)
      }
    }
    report.deletedDocuments = deleted
    report.cleanup = "completed"
  } catch {
    report.cleanup = "failed"
    throw new Error(
      `Cleanup failed for ${runId}; see /tmp/${runId}-cleanup.json`
    )
  } finally {
    report.finishedAt = new Date().toISOString()
    await writeFile(
      `/tmp/${runId}-report.json`,
      JSON.stringify(report, null, 2)
    )
    console.log(`Report: /tmp/${runId}-report.json; cleanup: ${report.cleanup}`)
    await firestore.terminate()
  }
}, 180_000)

describe("real Firestore concurrent writes", () => {
  it("registers 50 concurrent visits and rejects duplicate rewards", async () => {
    expect(
      await batch(
        "50 fresh company visits",
        ids.slice(0, 50).map((id) => () => visit(id))
      )
    ).toEqual(Array(50).fill("visited"))
    expect(
      await batch(
        "50 repeated company visits",
        ids.slice(0, 50).map((id) => () => visit(id))
      )
    ).toEqual(Array(50).fill("already-visited"))
    await Promise.all(
      ids
        .slice(0, 50)
        .map((id) => verifyProfile(id, 50, { companiesVisitedCount: 1 }))
    )
    expect(
      (await col("activityCompletions").where("eventId", "==", eventId).get())
        .size
    ).toBe(50)
    report.checks.push(
      "50 visits: one completion, one counter increment and 50 XP each after replay"
    )
  })
  it("registers 50 concurrent tags without duplicating XP", async () => {
    expect(
      await batch(
        "50 fresh tags",
        ids.slice(0, 50).map((id) => () => discover(id))
      )
    ).toEqual(Array(50).fill("discovered"))
    expect(
      await batch(
        "50 repeated tags",
        ids.slice(0, 50).map((id) => () => discover(id))
      )
    ).toEqual(Array(50).fill("already-discovered"))
    await Promise.all(
      ids.slice(0, 50).map((id) =>
        verifyProfile(id, 125, {
          companiesVisitedCount: 1,
          tagsDiscoveredCount: 1,
        })
      )
    )
    expect(
      (await col("activityCompletions").where("eventId", "==", eventId).get())
        .size
    ).toBe(100)
    report.checks.push(
      "50 tags: one completion, one counter increment and 75 additional XP each after replay"
    )
  })
  it("deduplicates simultaneous connection requests in both directions", async () => {
    const calls = Array.from({ length: 25 }, (_, i) => [
      () => connect(ids[i * 2], ids[i * 2 + 1]),
      () => connect(ids[i * 2 + 1], ids[i * 2]),
    ]).flat()
    const statuses = await batch("25 connection pairs, both directions", calls)
    expect(statuses.filter((s) => s === "connected")).toHaveLength(25)
    expect(statuses.filter((s) => s === "already-connected")).toHaveLength(25)
    await Promise.all(
      ids
        .slice(0, 50)
        .map((id) => verifyProfile(id, 130, { connectionsCount: 1 }))
    )
    expect(
      (await col("connections").where("eventId", "==", eventId).get()).size
    ).toBe(25)
    report.checks.push(
      "25 bidirectional pairs: one connection and 5 XP per participant"
    )
  })
  it("preserves the XP sum when different activities target one profile", async () => {
    const calls = Array.from({ length: 4 }, () => [
      () => visit(ids[50]),
      () => discover(ids[50]),
      () => complete(ids[50]),
      () => connect(ids[50], ids[51]),
    ]).flat()
    const statuses = await batch("16 mixed requests on one participant", calls)
    for (const status of ["visited", "discovered", "completed", "connected"])
      expect(statuses.filter((s) => s === status)).toHaveLength(1)
    await verifyProfile(ids[50], 180, {
      companiesVisitedCount: 1,
      tagsDiscoveredCount: 1,
      missionsCompletedCount: 1,
      connectionsCount: 1,
    })
    await verifyProfile(ids[51], 5, { connectionsCount: 1 })
    expect(
      (
        await col("activityCompletions")
          .where("participantId", "==", ids[50])
          .get()
      ).size
    ).toBe(3)
    report.checks.push(
      "Mixed activity contention: 180 XP, exactly three completions and one connection"
    )
  })
  it("grants onboarding and converts one repeated request only once", async () => {
    const id = ids[52]
    const grants = await batch(
      "8 simultaneous onboarding grants",
      Array.from(
        { length: 8 },
        () => () => ticket.ensureOnboardingTicket(eventId, id)
      )
    )
    expect(grants.filter((s) => s === "granted")).toHaveLength(1)
    const input = { ticketAmount: 2, idempotencyKey: randomUUID() }
    const converted = await batch(
      "8 conversions sharing one idempotency key",
      Array.from(
        { length: 8 },
        () => () =>
          ticket.convertXpToTickets({
            eventId,
            participantId: id,
            operatorId: id,
            input,
          })
      )
    )
    expect(converted.filter((s) => s === "converted")).toHaveLength(1)
    expect(converted.filter((s) => s === "already-converted")).toHaveLength(7)
    expect((await col("profiles").doc(id).get()).data()).toMatchObject({
      xp: 500,
      ticketBalance: 3,
      convertedXp: 400,
      onboardingTicketGranted: true,
    })
    expect(
      (await col("ticketTransactions").where("participantId", "==", id).get())
        .size
    ).toBe(2)
    report.checks.push(
      "Repeated onboarding and conversion: 3 tickets, 400 converted XP, original 500 XP preserved"
    )
  })
  it("does not overspend XP across independent conversion requests", async () => {
    const id = ids[53]
    const statuses = await batch(
      "8 conversions with distinct keys and limited XP",
      Array.from(
        { length: 8 },
        () => () =>
          ticket.convertXpToTickets({
            eventId,
            participantId: id,
            operatorId: id,
            input: { ticketAmount: 1, idempotencyKey: randomUUID() },
          })
      )
    )
    expect(statuses.filter((s) => s === "converted")).toHaveLength(2)
    expect(statuses.filter((s) => s === "insufficient-xp")).toHaveLength(6)
    expect((await col("profiles").doc(id).get()).data()).toMatchObject({
      xp: 500,
      ticketBalance: 2,
      convertedXp: 400,
    })
    expect(
      (await col("ticketTransactions").where("participantId", "==", id).get())
        .size
    ).toBe(2)
    report.checks.push(
      "Independent concurrent conversions cannot spend the same XP twice"
    )
  })
})
