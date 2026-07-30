import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({ firestore: {} }))

import * as repository from "./ranking.repository"

describe("ranking repository", () => {
  it("loads the ranking repository", () => {
    expect(repository.findRankingWindow).toBeTypeOf("function")
  })

  it("shows the first ten profiles when the participant is in the Top 3", () => {
    const ranking = repository.buildRankingWindow(createProfiles(15), "user-2")

    expect(ranking?.top.map(({ position }) => position)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    expect(ranking?.nearby).toEqual([])
  })

  it("shows the Top 3 and three adjacent positions on each side", () => {
    const ranking = repository.buildRankingWindow(createProfiles(20), "user-10")

    expect(ranking?.top.map(({ position }) => position)).toEqual([1, 2, 3])
    expect(ranking?.nearby.map(({ position }) => position)).toEqual([
      7, 8, 9, 10, 11, 12, 13,
    ])
  })

  it("does not repeat the Top 3 when the participant is fourth", () => {
    const ranking = repository.buildRankingWindow(createProfiles(10), "user-4")

    expect(ranking?.nearby.map(({ position }) => position)).toEqual([
      4, 5, 6, 7,
    ])
  })

  it("returns only the available adjacent positions near the end", () => {
    const ranking = repository.buildRankingWindow(createProfiles(10), "user-9")

    expect(ranking?.nearby.map(({ position }) => position)).toEqual([
      6, 7, 8, 9, 10,
    ])
  })

  it("builds the Top 10 from indexed query segments", () => {
    const profiles = createProfiles(10)
    const ranking = repository.buildIndexedRankingWindow({
      current: profiles[1],
      position: 2,
      top: profiles,
      above: [],
      below: [],
    })

    expect(ranking.top.map(({ position }) => position)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    expect(ranking.nearby).toEqual([])
  })

  it("positions indexed neighbors without repeating the podium", () => {
    const profiles = createProfiles(12)
    const ranking = repository.buildIndexedRankingWindow({
      current: profiles[7],
      position: 8,
      top: profiles.slice(0, 3),
      above: profiles.slice(4, 7),
      below: profiles.slice(8, 11),
    })

    expect(ranking.top.map(({ position }) => position)).toEqual([1, 2, 3])
    expect(ranking.nearby.map(({ position }) => position)).toEqual([
      5, 6, 7, 8, 9, 10, 11,
    ])
  })

  it("starts the indexed contextual window at fourth place", () => {
    const profiles = createProfiles(8)
    const ranking = repository.buildIndexedRankingWindow({
      current: profiles[3],
      position: 4,
      top: profiles.slice(0, 3),
      above: [],
      below: profiles.slice(4, 7),
    })

    expect(ranking.nearby.map(({ position }) => position)).toEqual([4, 5, 6, 7])
  })
})

function createProfiles(amount: number): repository.RankingProfile[] {
  return Array.from({ length: amount }, (_, index) => ({
    userId: `user-${index + 1}`,
    displayName: `User ${index + 1}`,
    avatarUrl: null,
    xp: amount - index,
    xpReachedAtMs: index,
  }))
}
