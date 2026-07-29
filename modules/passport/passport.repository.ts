import "server-only"

import { Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"

const COMPLETIONS_COLLECTION = "activityCompletions"

const passportCompletionDocumentSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  participantId: z.string().trim().min(1).max(128),
  activityType: z.enum(["company", "tag", "mission"]),
  activityId: z.string().trim().min(1).max(128),
  xpAwarded: z.number().int().positive(),
  completedAt: z.instanceof(Timestamp),
})

export type PassportCompletion = Readonly<{
  activityType: "company" | "tag" | "mission"
  activityId: string
  xpAwarded: number
  completedAt: Date
}>

export async function findPassportCompletions(
  eventId: string,
  participantId: string
): Promise<PassportCompletion[]> {
  const validatedEventId = z.string().trim().min(1).max(128).parse(eventId)
  const validatedParticipantId = z
    .string()
    .trim()
    .min(1)
    .max(128)
    .parse(participantId)
  const snapshots = await firestore
    .collection(COMPLETIONS_COLLECTION)
    .where("participantId", "==", validatedParticipantId)
    .get()
  const completions: PassportCompletion[] = []

  for (const snapshot of snapshots.docs) {
    const result = passportCompletionDocumentSchema.safeParse(snapshot.data())

    if (
      !result.success ||
      result.data.eventId !== validatedEventId ||
      result.data.participantId !== validatedParticipantId
    ) {
      continue
    }

    completions.push({
      activityType: result.data.activityType,
      activityId: result.data.activityId,
      xpAwarded: result.data.xpAwarded,
      completedAt: result.data.completedAt.toDate(),
    })
  }

  return completions
}
