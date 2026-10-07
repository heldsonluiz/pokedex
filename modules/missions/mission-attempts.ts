import * as z from "zod"

export const missionAttemptSchema = z.object({
  eventId: z.string(),
  participantId: z.string(),
  missionId: z.string(),
  attempts: z.number().int().nonnegative(),
  outcome: z.enum(["in-progress", "failed", "completed"]).optional(),
  lastScore: z.number().int().nonnegative().optional(),
  questionCount: z.number().int().positive().optional(),
})

export type MissionAttempt = z.infer<typeof missionAttemptSchema>

export function hasExhaustedMissionAttempts(
  attempt: Pick<MissionAttempt, "attempts" | "outcome"> | undefined,
  maxAttempts?: number
) {
  return (
    attempt?.outcome === "failed" ||
    (maxAttempts !== undefined && (attempt?.attempts ?? 0) >= maxAttempts)
  )
}
