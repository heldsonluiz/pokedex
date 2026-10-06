import { INTERESTS } from "@/modules/profile/profile-interests"

export function countSharedInterestConnections(
  eventId: string,
  participantId: string,
  connections: unknown[]
): number {
  const people = new Set<string>()
  for (const value of connections) {
    if (!value || typeof value !== "object") continue
    const connection = value as Record<string, unknown>
    const ids = connection.participantIds
    const interests = connection.sharedInterests
    if (
      connection.eventId !== eventId ||
      connection.status !== "accepted" ||
      !Array.isArray(ids) ||
      ids.length !== 2 ||
      !ids.includes(participantId) ||
      ids[0] === ids[1] ||
      !ids.every((id) => typeof id === "string") ||
      !Array.isArray(interests) ||
      !interests.some((id) => INTERESTS.some((interest) => interest.id === id))
    )
      continue
    const other = ids.find((id) => id !== participantId)
    if (other) people.add(other)
  }
  return people.size
}
