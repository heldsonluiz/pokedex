import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/config/scores", () => ({ SCORES: {} }))
vi.mock("@/modules/companies/company.repository", () => ({}))
vi.mock("@/modules/missions/mission.repository", () => ({}))
vi.mock("@/modules/passport/passport.repository", () => ({}))
vi.mock("@/modules/profile/profile.authorization", () => ({}))
vi.mock("@/modules/profile/profile.service", () => ({}))
vi.mock("@/modules/tags/tag.repository", () => ({}))

import { buildParticipantPassport } from "./passport.service"

const now = new Date("2026-07-29T12:00:00.000Z")

describe("passport service", () => {
  it("aggregates progress and preserves the XP actually awarded", () => {
    const passport = buildParticipantPassport({
      companies: [
        {
          id: "company-1",
          name: "Company",
          description: "Company description",
          logoUrl: "https://example.com/logo.png",
          stampImageUrl: "https://example.com/stamp.png",
          xpAwarded: 40,
          visitedAt: now,
        },
      ],
      tags: {
        discoveredCount: 1,
        totalCount: 2,
        items: [
          {
            status: "discovered",
            slot: 1,
            name: "Tag",
            imageUrl: "https://example.com/tag.png",
            xpAwarded: 60,
            discoveredAt: now,
          },
          { status: "locked", slot: 2 },
        ],
      },
      missions: [
        {
          id: "mission-1",
          title: "Mission",
          imageUrl: null,
          status: "completed",
          xpAwarded: 30,
          completedAt: now,
        },
        {
          id: "mission-2",
          title: "Pending",
          imageUrl: null,
          status: "available",
          xpAwarded: 50,
          completedAt: null,
        },
      ],
    })

    expect(passport.completedCount).toBe(3)
    expect(passport.totalCount).toBe(5)
    expect(passport.xpEarned).toBe(130)
    expect(passport.recentAchievements).toHaveLength(3)
  })

  it("handles a passport without configured activities", () => {
    const passport = buildParticipantPassport({
      companies: [],
      tags: { discoveredCount: 0, totalCount: 0, items: [] },
      missions: [],
    })

    expect(passport.completedCount).toBe(0)
    expect(passport.totalCount).toBe(0)
    expect(passport.xpEarned).toBe(0)
  })
})
