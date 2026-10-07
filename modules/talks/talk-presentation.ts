import type { TalkListItem } from "./talk.service"

export function getTalkEvaluationGroup(
  talk: Pick<TalkListItem, "evaluationStatus" | "rating">
): "open" | "locked" | "closed" {
  return talk.rating ? "closed" : talk.evaluationStatus
}
