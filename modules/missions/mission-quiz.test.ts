import { describe, expect, it } from "vitest"

import {
  completeQuizMissionInputSchema,
  missionFieldsSchema,
} from "./mission.schema"
import {
  missionQuizConfigSchema,
  publicMissionQuiz,
  scoreMissionQuiz,
} from "./mission-quiz"

const quiz = {
  questions: [
    {
      id: "q1",
      prompt: "Quanto é 1 + 1?",
      options: ["2", "3"],
      correctOptionIndex: 0,
    },
    {
      id: "q2",
      prompt: "Quanto é 2 + 2?",
      options: ["3", "4"],
      correctOptionIndex: 1,
    },
  ],
  minCorrectAnswers: 1,
  maxAttempts: 2,
}

describe("quiz missions", () => {
  it("grades against the server answer key independent of submission order", () => {
    expect(
      scoreMissionQuiz(quiz, [
        { questionId: "q2", optionIndex: 1 },
        { questionId: "q1", optionIndex: 0 },
      ])
    ).toBe(2)
    expect(
      scoreMissionQuiz(quiz, [
        { questionId: "q1", optionIndex: 1 },
        { questionId: "q2", optionIndex: 1 },
      ])
    ).toBe(1)
  })
  it("rejects missing, repeated, unknown and out-of-range responses", () => {
    for (const answers of [
      [],
      [{ questionId: "q1", optionIndex: 0 }],
      [
        { questionId: "q1", optionIndex: 0 },
        { questionId: "q1", optionIndex: 1 },
      ],
      [
        { questionId: "unknown", optionIndex: 0 },
        { questionId: "q2", optionIndex: 1 },
      ],
      [
        { questionId: "q1", optionIndex: 2 },
        { questionId: "q2", optionIndex: 1 },
      ],
    ])
      expect(scoreMissionQuiz(quiz, answers)).toBeNull()
  })
  it("never exposes the answer key to the participant", () => {
    const publicQuiz = publicMissionQuiz(quiz, 42)
    expect(publicQuiz.revision).toBe(42)
    expect(publicQuiz.questions).toEqual(
      quiz.questions.map(({ id, prompt, options }) => ({ id, prompt, options }))
    )
    expect(JSON.stringify(publicQuiz)).not.toContain("correctOptionIndex")
  })
  it("rejects impossible passing scores and invalid question definitions", () => {
    expect(missionQuizConfigSchema.safeParse(quiz).success).toBe(true)
    expect(
      missionQuizConfigSchema.safeParse({
        ...quiz,
        questions: [{ ...quiz.questions[0], options: ["A", "B", "C", "D"] }],
      }).success
    ).toBe(false)
    expect(
      missionQuizConfigSchema.safeParse({ ...quiz, minCorrectAnswers: 3 })
        .success
    ).toBe(false)
    expect(
      missionQuizConfigSchema.safeParse({
        ...quiz,
        questions: [quiz.questions[0], quiz.questions[0]],
      }).success
    ).toBe(false)
    for (const question of [
      { ...quiz.questions[0], correctOptionIndex: 2 },
      { ...quiz.questions[0], options: ["2", "2"] },
      { ...quiz.questions[0], prompt: " " },
    ])
      expect(
        missionQuizConfigSchema.safeParse({ ...quiz, questions: [question] })
          .success
      ).toBe(false)
  })
  it("requires quiz configuration only for quizzes and maintains older missions", () => {
    const base = {
      id: "mission-1",
      eventId: "event-1",
      qrId: null,
      title: "Quiz",
      description: "Responda",
      imageUrl: null,
      validationType: "quiz",
      active: true,
      order: 0,
      xpAwarded: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(missionFieldsSchema.safeParse(base).success).toBe(false)
    expect(
      missionFieldsSchema.safeParse({ ...base, quizConfig: quiz }).success
    ).toBe(true)
    expect(
      missionFieldsSchema.safeParse({
        ...base,
        validationType: "reviewer",
        quizConfig: quiz,
      }).success
    ).toBe(false)
    expect(
      missionFieldsSchema.parse({ ...base, validationType: "reviewer" })
        .quizConfig
    ).toBeNull()
  })
  it("rejects client-supplied scores and participant IDs", () => {
    const input = {
      missionId: "mission-1",
      revision: 42,
      answers: [{ questionId: "q1", optionIndex: 0 }],
    }
    expect(completeQuizMissionInputSchema.safeParse(input).success).toBe(true)
    expect(
      completeQuizMissionInputSchema.safeParse({ ...input, xpAwarded: 1000 })
        .success
    ).toBe(false)
    expect(
      completeQuizMissionInputSchema.safeParse({
        ...input,
        participantId: "other",
      }).success
    ).toBe(false)
  })
})
