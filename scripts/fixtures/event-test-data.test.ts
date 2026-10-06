import { existsSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { missionFieldsSchema } from "@/modules/missions/mission.schema"
import { scoreMissionQuiz } from "@/modules/missions/mission-quiz"
import {
  interestsSchema,
  sharedInterests,
} from "@/modules/profile/profile-interests"

import {
  createCatalogFixture,
  getTestParticipantInterests,
  getTestSharedInterests,
} from "./event-test-data.mjs"

const options = {
  eventId: "event-test",
  appOrigin: new URL("http://localhost:3001"),
  now: new Date("2026-10-06T12:00:00Z"),
}
const documents = createCatalogFixture(options)
const missions = documents
  .filter((item) => item.collection === "missions")
  .map((item) => missionFieldsSchema.parse(item.data))

describe("event test seed", () => {
  it("generates valid missions for all implemented validation types", () => {
    expect(missions).toHaveLength(21)
    expect(new Set(missions.map((mission) => mission.validationType))).toEqual(
      new Set(["qr", "reviewer", "automatic", "keyword", "quiz"])
    )
    expect(
      missions.filter(
        (mission) => mission.progressRequirement?.type === "shared-interests"
      )
    ).toHaveLength(2)
    expect(
      missions.filter((mission) => mission.validationType === "keyword")
    ).toHaveLength(2)
    expect(
      missions.filter((mission) => mission.validationType === "quiz")
    ).toHaveLength(2)
  })
  it("references existing prerequisites and local images for every mission", () => {
    const keys = new Set(
      documents.map((item) => `${item.collection}:${item.id}`)
    )
    for (const mission of missions) {
      expect(mission.imageUrl).toBe(
        `http://localhost:3001/images/assets/missions/${mission.id}.png`
      )
      expect(
        existsSync(
          new URL(
            `../../public/images/assets/missions/${mission.id}.png`,
            import.meta.url
          )
        )
      ).toBe(true)
      for (const prerequisite of mission.prerequisites)
        expect(
          keys.has(
            `${prerequisite.type === "company" ? "companies" : "missions"}:${prerequisite.activityId}`
          )
        ).toBe(true)
      if (
        mission.validationType === "keyword" ||
        mission.validationType === "quiz" ||
        mission.progressRequirement?.type === "shared-interests"
      ) {
        expect(mission.qrId).toBeNull()
      }
    }
  })
  it("provides solvable quizzes with at most three alternatives", () => {
    for (const mission of missions.filter((item) => item.quizConfig)) {
      const quiz = mission.quizConfig!
      expect(
        quiz.questions.every((question) => question.options.length <= 3)
      ).toBe(true)
      expect(
        scoreMissionQuiz(
          quiz,
          quiz.questions.map((question) => ({
            questionId: question.id,
            optionIndex: question.correctOptionIndex,
          }))
        )
      ).toBeGreaterThanOrEqual(quiz.minCorrectAnswers)
    }
  })
  it("produces valid interests and snapshots matching the application", () => {
    const groups = Array.from({ length: 150 }, (_, index) =>
      getTestParticipantInterests(index + 1)
    )
    expect(groups.some((group) => group.length === 0)).toBe(true)
    for (const group of groups)
      expect(interestsSchema.safeParse(group).success).toBe(true)
    for (const first of groups.slice(0, 4)) {
      for (const second of groups.slice(0, 4)) {
        expect(new Set(getTestSharedInterests(first, second))).toEqual(
          new Set(sharedInterests(first, second))
        )
      }
    }
    expect(getTestSharedInterests(groups[0], groups[1])).toEqual([])
    expect(
      getTestSharedInterests(
        getTestParticipantInterests(0),
        getTestParticipantInterests(1)
      )
    ).toEqual(["cloud"])
  })
  it("keeps mission identifiers and display order unique", () => {
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(
      missions.length
    )
    expect(new Set(missions.map((mission) => mission.order)).size).toBe(
      missions.length
    )
  })
})
