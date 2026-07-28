import { describe, expect, it } from "vitest"

import { discoverTagInputSchema, tagFieldsSchema } from "./tag.schema"
import { tagDiscoveryFieldsSchema } from "./tag-discovery.schema"

const NOW = new Date("2026-07-28T12:00:00.000Z")
const QR_ID = "123e4567-e89b-42d3-a456-426614174000"

describe("tag schemas", () => {
  it("accepts an active tag with the default score", () => {
    const result = tagFieldsSchema.safeParse({
      id: "tag-a",
      eventId: "devfest-2026",
      qrId: QR_ID,
      name: "Hidden Tag",
      description: "Found near the main stage.",
      imageUrl: "https://example.com/tag.png",
      active: true,
      order: 0,
      xpAwarded: null,
      createdAt: NOW,
      updatedAt: NOW,
    })

    expect(result.success).toBe(true)
  })

  it("rejects unexpected discovery input fields", () => {
    const result = discoverTagInputSchema.safeParse({
      eventId: "devfest-2026",
      qrId: QR_ID,
      participantId: "untrusted-participant",
    })

    expect(result.success).toBe(false)
  })

  it("records a permanent tag completion with the effective score", () => {
    const discovery = tagDiscoveryFieldsSchema.parse({
      id: "a".repeat(64),
      eventId: "devfest-2026",
      participantId: "participant-a",
      activityType: "tag",
      activityId: "tag-a",
      qrId: QR_ID,
      xpAwarded: 75,
      completedAt: NOW,
    })

    expect(discovery.xpAwarded).toBe(75)
  })
})
