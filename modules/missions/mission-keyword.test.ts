import { describe, expect, it } from "vitest"

import {
  completeKeywordMissionInputSchema,
  missionFieldsSchema,
} from "./mission.schema"
import { normalizeKeyword } from "./mission-keyword"

const mission = {
  id: "keyword-1",
  eventId: "event-1",
  qrId: null,
  title: "Descubra a palavra",
  description: "Encontre a pista no evento.",
  imageUrl: null,
  validationType: "keyword",
  active: true,
  order: 0,
  xpAwarded: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
  keywordConfig: { acceptedAnswers: ["Conexão", "Networking"], maxAttempts: 3 },
}

describe("keyword mission", () => {
  it("ignores case, accents and extra whitespace without dropping punctuation", () => {
    expect(normalizeKeyword("  CONEXÃO  ")).toBe("conexao")
    expect(normalizeKeyword("Olá   mundo")).toBe("ola mundo")
    expect(normalizeKeyword("C++")).not.toBe(normalizeKeyword("C"))
    expect(normalizeKeyword("ação")).toBe(normalizeKeyword("ac\u0327a\u0303o"))
  })
  it("accepts aliases and prerequisites", () => {
    expect(
      missionFieldsSchema.safeParse({
        ...mission,
        prerequisites: [{ type: "company", activityId: "company-1" }],
      }).success
    ).toBe(true)
  })
  it("requires configuration, answers, and a positive bounded attempt limit", () => {
    for (const keywordConfig of [
      null,
      { acceptedAnswers: [], maxAttempts: 3 },
      { acceptedAnswers: [" "], maxAttempts: 3 },
      { acceptedAnswers: ["ok"], maxAttempts: 0 },
      { acceptedAnswers: ["ok"], maxAttempts: 101 },
    ]) {
      expect(
        missionFieldsSchema.safeParse({ ...mission, keywordConfig }).success
      ).toBe(false)
    }
  })
  it("rejects QR identifiers and keyword configuration on other mission types", () => {
    expect(
      missionFieldsSchema.safeParse({
        ...mission,
        qrId: "c35d5cf6-a3f4-4ae0-9e6f-0bad73cdded6",
      }).success
    ).toBe(false)
    expect(
      missionFieldsSchema.safeParse({ ...mission, validationType: "reviewer" })
        .success
    ).toBe(false)
  })
  it("rejects empty answers and client-supplied reward or participant identifiers", () => {
    expect(
      completeKeywordMissionInputSchema.safeParse({
        missionId: "keyword-1",
        answer: " ",
      }).success
    ).toBe(false)
    expect(
      completeKeywordMissionInputSchema.safeParse({
        missionId: "keyword-1",
        answer: "ok",
        xpAwarded: 999,
      }).success
    ).toBe(false)
  })
})
