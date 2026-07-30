import "server-only"

import { Timestamp } from "firebase-admin/firestore"
import * as z from "zod"

import { firestore } from "@/lib/firebase/admin"

const RAFFLE_LIVE_SIGNALS_COLLECTION = "raffleLiveSignals"

const raffleLiveSignalInputSchema = z.object({
  eventId: z.string().trim().min(1).max(128),
  phase: z.enum(["drawing", "updated"]),
  prizeName: z.string().trim().min(1).max(160).nullable(),
})

export async function publishRaffleLiveSignal(input: {
  eventId: string
  phase: "drawing" | "updated"
  prizeName?: string | null
}) {
  const signal = raffleLiveSignalInputSchema.parse({
    ...input,
    prizeName: input.prizeName ?? null,
  })

  await firestore
    .collection(RAFFLE_LIVE_SIGNALS_COLLECTION)
    .doc(signal.eventId)
    .set({
      ...signal,
      updatedAt: Timestamp.now(),
    })
}
