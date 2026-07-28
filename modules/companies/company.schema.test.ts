import { describe, expect, it } from "vitest"

import { companyFieldsSchema, visitCompanyInputSchema } from "./company.schema"
import { companyVisitFieldsSchema } from "./company-visit.schema"

const NOW = new Date("2026-07-28T12:00:00.000Z")
const QR_ID = "123e4567-e89b-42d3-a456-426614174000"

describe("company schemas", () => {
  it("accepts an active company with an optional custom score and stamp", () => {
    const company = companyFieldsSchema.parse({
      id: "company-a",
      eventId: "devfest-2026",
      qrId: QR_ID,
      name: "Company A",
      description: "Main sponsor",
      logoUrl: "https://example.com/logo.png",
      stampImageUrl: "https://example.com/stamp.png",
      active: true,
      xpAwarded: 100,
      createdAt: NOW,
      updatedAt: NOW,
    })

    expect(company).toMatchObject({
      active: true,
      xpAwarded: 100,
    })
  })

  it("allows the default score and logo fallback", () => {
    const result = companyFieldsSchema.safeParse({
      id: "company-a",
      eventId: "devfest-2026",
      qrId: QR_ID,
      name: "Company A",
      description: null,
      logoUrl: "https://example.com/logo.png",
      stampImageUrl: null,
      active: true,
      xpAwarded: null,
      createdAt: NOW,
      updatedAt: NOW,
    })

    expect(result.success).toBe(true)
  })

  it("rejects unexpected visit input fields", () => {
    const result = visitCompanyInputSchema.safeParse({
      eventId: "devfest-2026",
      qrId: QR_ID,
      participantId: "untrusted-participant",
    })

    expect(result.success).toBe(false)
  })

  it("records a company completion with the effective score", () => {
    const visit = companyVisitFieldsSchema.parse({
      id: "a".repeat(64),
      eventId: "devfest-2026",
      participantId: "participant-a",
      activityType: "company",
      activityId: "company-a",
      qrId: QR_ID,
      xpAwarded: 50,
      completedAt: NOW,
    })

    expect(visit.xpAwarded).toBe(50)
  })
})
