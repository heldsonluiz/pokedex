import { describe, expect, it } from "vitest"

import {
  submitTalkRatingInputSchema,
  talkRatingFieldsSchema,
} from "./talk-rating.schema"

const VALID_INPUT = {
  talkId: "talk-a",
  speakerRating: 5,
  contentRating: 4,
  comprehensionRating: 3,
  comment: "A explicação trouxe exemplos muito interessantes.",
}

describe("talk rating schemas", () => {
  it("accepts the three scores and a meaningful required comment", () => {
    expect(submitTalkRatingInputSchema.parse(VALID_INPUT)).toEqual(VALID_INPUT)
  })

  it.each([
    ["speakerRating", 0],
    ["contentRating", 6],
    ["comprehensionRating", 3.5],
  ])("rejects an invalid %s", (field, score) => {
    const result = submitTalkRatingInputSchema.safeParse({
      ...VALID_INPUT,
      [field]: score,
    })

    expect(result.success).toBe(false)
  })

  it("requires a comment with at least 20 characters", () => {
    const result = submitTalkRatingInputSchema.safeParse({
      ...VALID_INPUT,
      comment: "Muito boa",
    })

    expect(result.success).toBe(false)
  })

  it("rejects a comment made from a single repeated character", () => {
    const result = submitTalkRatingInputSchema.safeParse({
      ...VALID_INPUT,
      comment: "aaaaaaaaaaaaaaaaaaaaaaaa",
    })

    expect(result.success).toBe(false)
  })

  it("records the effective score granted by the transaction", () => {
    const rating = talkRatingFieldsSchema.parse({
      ...VALID_INPUT,
      id: "a".repeat(64),
      eventId: "devfest-2026",
      participantId: "participant-a",
      xpAwarded: 75,
      completedAt: new Date("2026-07-30T12:00:00.000Z"),
    })

    expect(rating.xpAwarded).toBe(75)
  })
})
