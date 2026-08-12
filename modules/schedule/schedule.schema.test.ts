import { describe, expect, it } from "vitest"

import { scheduleFieldsSchema } from "./schedule.schema"

const BASE_ENTRY = {
  id: "schedule-1",
  eventId: "devfest-2026",
  startAt: new Date("2026-10-17T12:00:00.000Z"),
  endAt: new Date("2026-10-17T13:00:00.000Z"),
  active: true,
  createdAt: new Date("2026-08-12T12:00:00.000Z"),
  updatedAt: new Date("2026-08-12T12:00:00.000Z"),
}

describe("schedule schema", () => {
  it("accepts the site talk schedule contract", () => {
    expect(
      scheduleFieldsSchema.safeParse({
        ...BASE_ENTRY,
        track: "MINAS",
        order: 0,
        activity: { type: "talk", talkId: "talk-1" },
      }).success
    ).toBe(true)
  })

  it("accepts opening as a general activity without a talk", () => {
    expect(
      scheduleFieldsSchema.safeParse({
        ...BASE_ENTRY,
        track: null,
        order: null,
        activity: { type: "opening", title: "Abertura" },
      }).success
    ).toBe(true)
  })

  it.each(["opening_keynote", "closing_keynote"] as const)(
    "accepts %s linked to a keynote without a track",
    (type) => {
      expect(
        scheduleFieldsSchema.safeParse({
          ...BASE_ENTRY,
          track: null,
          order: null,
          activity: { type, talkId: "keynote-1" },
        }).success
      ).toBe(true)
    }
  )

  it("rejects tracks on general activities", () => {
    expect(
      scheduleFieldsSchema.safeParse({
        ...BASE_ENTRY,
        track: "CURADO",
        order: 1,
        activity: { type: "closing", title: "Encerramento" },
      }).success
    ).toBe(false)
  })
})
