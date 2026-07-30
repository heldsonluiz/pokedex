import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({
  firestore: {},
}))

import * as talkRepository from "./talk.repository"

describe("talk repository", () => {
  it("exposes catalog, rating and administration operations", () => {
    expect(talkRepository.findActiveTalks).toBeTypeOf("function")
    expect(talkRepository.findActiveTalkById).toBeTypeOf("function")
    expect(talkRepository.findVisibleSpeakers).toBeTypeOf("function")
    expect(talkRepository.findTalkRatingsByParticipant).toBeTypeOf("function")
    expect(talkRepository.completeTalkRating).toBeTypeOf("function")
    expect(talkRepository.updateTalkEvaluationStatus).toBeTypeOf("function")
  })
})
