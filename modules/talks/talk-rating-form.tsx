"use client"

import { LoaderCircle, Send, Star } from "lucide-react"
import { startTransition, useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  submitTalkRatingAction,
  type TalkRatingActionState,
} from "./talk.actions"

const initialState: TalkRatingActionState = { success: false }

const ratingQuestions = [
  {
    name: "speakerRating",
    label: "Quanto você gostou do palestrante?",
  },
  {
    name: "contentRating",
    label: "O quanto o conteúdo foi interessante?",
  },
  {
    name: "comprehensionRating",
    label: "O quanto você conseguiu acompanhar a palestra?",
  },
] as const

type RatingField = (typeof ratingQuestions)[number]["name"]

export function TalkRatingForm({ talkId }: Readonly<{ talkId: string }>) {
  const [state, formAction, isPending] = useActionState(
    submitTalkRatingAction,
    initialState
  )
  const [ratings, setRatings] = useState<Partial<Record<RatingField, number>>>(
    {}
  )
  const [comment, setComment] = useState("")

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        startTransition(() => formAction(formData))
      }}
    >
      <input type="hidden" name="talkId" value={talkId} />

      {ratingQuestions.map((question) => {
        const error = state.fieldErrors?.[question.name]

        return (
          <fieldset
            key={question.name}
            className="space-y-3"
            aria-describedby={error ? `${question.name}-error` : undefined}
          >
            <legend className="text-sm font-medium">{question.label}</legend>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={score}
                  className={cn(
                    "relative flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-background text-xs transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    ratings[question.name] === score &&
                      "border-primary bg-primary/10 text-primary",
                    isPending && "pointer-events-none opacity-50"
                  )}
                >
                  <input
                    type="radio"
                    name={question.name}
                    value={score}
                    className="absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-xl outline-none"
                    disabled={isPending}
                    checked={ratings[question.name] === score}
                    onChange={() =>
                      setRatings((current) => ({
                        ...current,
                        [question.name]: score,
                      }))
                    }
                  />
                  <Star
                    className="pointer-events-none size-4 fill-current"
                    aria-hidden="true"
                  />
                  <span className="pointer-events-none">{score}</span>
                </label>
              ))}
            </div>
            {error && (
              <p
                id={`${question.name}-error`}
                className="text-xs text-destructive"
              >
                {error}
              </p>
            )}
          </fieldset>
        )
      })}

      <div className="space-y-2">
        <label htmlFor="talk-rating-comment" className="text-sm font-medium">
          Conte como foi sua experiência
        </label>
        <Textarea
          id="talk-rating-comment"
          name="comment"
          minLength={20}
          maxLength={500}
          rows={5}
          disabled={isPending}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors?.comment)}
          aria-describedby={
            state.fieldErrors?.comment
              ? "talk-rating-comment-error"
              : "talk-rating-comment-help"
          }
          placeholder="Compartilhe o que mais chamou sua atenção e como foi acompanhar o conteúdo."
        />
        {state.fieldErrors?.comment ? (
          <p
            id="talk-rating-comment-error"
            className="text-xs text-destructive"
          >
            {state.fieldErrors.comment}
          </p>
        ) : (
          <p
            id="talk-rating-comment-help"
            className="text-xs text-muted-foreground"
          >
            Escreva entre 20 e 500 caracteres.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Send aria-hidden="true" />
        )}
        {isPending ? "Enviando..." : "Enviar avaliação"}
      </Button>

      {state.message && (
        <p
          role="status"
          className={
            state.success
              ? "rounded-xl bg-success/10 p-3 text-sm text-success"
              : "rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
