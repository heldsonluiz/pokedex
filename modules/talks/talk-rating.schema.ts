import * as z from "zod"

export const talkRatingScoreSchema = z
  .number()
  .int()
  .min(1, "Selecione uma nota de 1 a 5")
  .max(5, "Selecione uma nota de 1 a 5")

export const talkRatingCommentSchema = z
  .string()
  .trim()
  .min(20, "Escreva um comentário com pelo menos 20 caracteres")
  .max(500, "O comentário deve ter no máximo 500 caracteres")
  .refine(
    (comment) =>
      new Set(comment.toLocaleLowerCase("pt-BR").replaceAll(/\s/g, "")).size >
      1,
    "Escreva um comentário válido"
  )

export const submitTalkRatingInputSchema = z
  .object({
    talkId: z.string().trim().min(1).max(128),
    speakerRating: talkRatingScoreSchema,
    contentRating: talkRatingScoreSchema,
    comprehensionRating: talkRatingScoreSchema,
    comment: talkRatingCommentSchema,
  })
  .strict()

export const talkRatingFieldsSchema = submitTalkRatingInputSchema
  .extend({
    id: z.string().length(64),
    eventId: z.string().trim().min(1).max(128),
    participantId: z.string().trim().min(1).max(128),
    xpAwarded: z.number().int().positive(),
    completedAt: z.date(),
  })
  .strict()

export type SubmitTalkRatingInput = z.infer<typeof submitTalkRatingInputSchema>
export type TalkRating = z.infer<typeof talkRatingFieldsSchema>
