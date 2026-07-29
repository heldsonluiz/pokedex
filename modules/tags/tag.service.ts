import "server-only"

import type { Session } from "next-auth"

import { SCORES } from "@/config/scores"
import { env } from "@/env"
import { evaluateParticipantBadges } from "@/modules/badges/badge.service"
import { requireProfileForSession } from "@/modules/profile/profile.service"

import {
  completeTagDiscovery,
  findActiveTags,
  findTagDiscoveriesByParticipant,
} from "./tag.repository"
import { discoverTagInputSchema } from "./tag.schema"

export type TagDiscoveryOperationResult =
  | Readonly<{
      success: true
      code: "TAG_DISCOVERED" | "TAG_ALREADY_DISCOVERED"
      tagName: string
      imageUrl: string
      xpAwarded: number
    }>
  | Readonly<{
      success: false
      code:
        | "INVALID_EVENT"
        | "PROFILE_INCOMPLETE"
        | "TAG_INACTIVE"
        | "TAG_NOT_FOUND"
    }>

export type TagCollectionItem =
  | Readonly<{
      status: "locked"
      slot: number
    }>
  | Readonly<{
      status: "discovered"
      slot: number
      name: string
      description: string | null
      imageUrl: string
      xpAwarded: number
      discoveredAt: Date
    }>

export type TagCollection = Readonly<{
  discoveredCount: number
  totalCount: number
  items: TagCollectionItem[]
}>

export async function listTagsForSession(
  session: Session
): Promise<TagCollection> {
  const profile = await requireProfileForSession(session)
  const [tags, discoveries] = await Promise.all([
    findActiveTags(profile.eventId),
    findTagDiscoveriesByParticipant(profile.eventId, profile.userId),
  ])
  const discoveriesByTag = new Map(
    discoveries.map((discovery) => [discovery.activityId, discovery])
  )
  const items = tags.map<TagCollectionItem>((tag, index) => {
    const discovery = discoveriesByTag.get(tag.id)
    const slot = index + 1

    if (!discovery) {
      return { status: "locked", slot }
    }

    return {
      status: "discovered",
      slot,
      name: tag.name,
      description: tag.description,
      imageUrl: tag.imageUrl,
      xpAwarded: discovery.xpAwarded,
      discoveredAt: discovery.completedAt,
    }
  })

  return {
    discoveredCount: items.filter((item) => item.status === "discovered")
      .length,
    totalCount: items.length,
    items,
  }
}

export async function discoverTagForSession(
  session: Session,
  input: unknown
): Promise<TagDiscoveryOperationResult> {
  const target = discoverTagInputSchema.parse(input)
  const profile = await requireProfileForSession(session)

  if (target.eventId !== env.EVENT_ID || profile.eventId !== target.eventId) {
    return { success: false, code: "INVALID_EVENT" }
  }

  if (!profile.onboardingCompleted) {
    return { success: false, code: "PROFILE_INCOMPLETE" }
  }

  const result = await completeTagDiscovery({
    eventId: target.eventId,
    qrId: target.qrId,
    participantId: profile.userId,
    defaultXpAwarded: SCORES.TAG_DISCOVERY,
  })

  switch (result.status) {
    case "discovered":
      await evaluateParticipantBadges(target.eventId, profile.userId, {
        type: "tag",
        id: result.tag.id,
      })

      return {
        success: true,
        code: "TAG_DISCOVERED",
        tagName: result.tag.name,
        imageUrl: result.tag.imageUrl,
        xpAwarded: result.discovery.xpAwarded,
      }
    case "already-discovered":
      return {
        success: true,
        code: "TAG_ALREADY_DISCOVERED",
        tagName: result.tag.name,
        imageUrl: result.tag.imageUrl,
        xpAwarded: result.discovery.xpAwarded,
      }
    case "inactive":
      return { success: false, code: "TAG_INACTIVE" }
    case "not-found":
      return { success: false, code: "TAG_NOT_FOUND" }
    case "profile-unavailable":
      return { success: false, code: "PROFILE_INCOMPLETE" }
  }
}
