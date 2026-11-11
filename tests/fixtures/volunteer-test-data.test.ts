import { describe, expect, it } from "vitest"

import { companyFieldsSchema } from "@/modules/companies/company.schema"
import { missionFieldsSchema } from "@/modules/missions/mission.schema"
import { raffleFieldsSchema } from "@/modules/raffles/raffle.schema"
import { rewardFieldsSchema } from "@/modules/rewards/reward.schema"
import { scheduleFieldsSchema } from "@/modules/schedule/schedule.schema"
import { tagFieldsSchema } from "@/modules/tags/tag.schema"
import { speakerFieldsSchema } from "@/modules/talks/speaker.schema"
import { talkFieldsSchema } from "@/modules/talks/talk.schema"
import { TEST_MISSIONS } from "@/scripts/fixtures/event-test-data.mjs"
import { createVolunteerFixture } from "@/scripts/fixtures/volunteer-test-data.mjs"

const documents = createVolunteerFixture({
  eventId: "volunteer-test",
  appOrigin: new URL("https://pokedex.example.test"),
  now: new Date("2026-09-09T12:00:00Z"),
})

describe("volunteer catalog", () => {
  it("does not change the general fixture connection goals", () => {
    expect(
      TEST_MISSIONS.filter(
        (mission) => mission.progressRequirement?.type === "connections"
      ).map((mission) => mission.progressRequirement?.target)
    ).toEqual([10, 20, 50])
  })
  it("matches the application schemas before any destructive seed", () => {
    const schemas = {
      companies: companyFieldsSchema,
      missions: missionFieldsSchema,
      raffles: raffleFieldsSchema,
      rewards: rewardFieldsSchema,
      schedule: scheduleFieldsSchema,
      tags: tagFieldsSchema,
      speakers: speakerFieldsSchema,
      talks: talkFieldsSchema,
    }
    for (const document of documents) {
      const schema = schemas[document.collection as keyof typeof schemas]
      if (schema)
        expect(
          schema.safeParse({ id: document.id, ...document.data }).success,
          `${document.collection}/${document.id}`
        ).toBe(true)
    }
    expect(
      documents.some((item) =>
        ["profiles", "connections", "activityCompletions"].includes(
          item.collection
        )
      )
    ).toBe(false)
    expect(
      new Set(documents.map((item) => `${item.collection}/${item.id}`)).size
    ).toBe(documents.length)
  })

  it("keeps prerequisites reachable and at least half of companies linked to QR missions", () => {
    const companies = documents.filter(
      (item) => item.collection === "companies"
    )
    const missions = documents.filter((item) => item.collection === "missions")
    const linked = new Set<string>()
    for (const document of missions) {
      const mission = { data: missionFieldsSchema.parse(document.data) }
      for (const prerequisite of mission.data.prerequisites) {
        const collection =
          prerequisite.type === "company" ? companies : missions
        expect(
          collection.some((item) => item.id === prerequisite.activityId)
        ).toBe(true)
        if (
          prerequisite.type === "company" &&
          mission.data.validationType === "qr"
        )
          linked.add(prerequisite.activityId)
      }
      if (mission.data.progressRequirement?.type === "connections")
        expect(mission.data.progressRequirement.target).toBeLessThan(20)
    }
    expect(linked.size).toBeGreaterThanOrEqual(Math.ceil(companies.length / 2))
    for (const talk of documents.filter(
      (item) => item.collection === "talks"
    )) {
      expect(
        documents.some(
          (item) =>
            item.collection === "schedule" &&
            "activity" in item.data &&
            item.data.activity.talkId === talk.id
        )
      ).toBe(true)
      for (const speakerId of talkFieldsSchema.parse({
        id: talk.id,
        ...talk.data,
      }).speakerIds)
        expect(
          documents.some(
            (item) => item.collection === "speakers" && item.id === speakerId
          )
        ).toBe(true)
    }
  })
})
