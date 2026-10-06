"use client"

import { useRouter } from "next/navigation"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { completeKeywordMissionAction } from "./mission.actions"

export function MissionKeywordForm({
  missionId,
  maxAttempts,
}: {
  missionId: string
  maxAttempts?: number
}) {
  const router = useRouter()
  const inputId = useId()
  const [answer, setAnswer] = useState("")
  const [pending, setPending] = useState(false)
  const [finished, setFinished] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault()
        if (pending || finished) return
        setPending(true)
        try {
          const result = await completeKeywordMissionAction({
            missionId,
            answer,
          })
          setIsError(!result.success)
          if (result.success) {
            setFinished(true)
            setMessage(
              result.code === "MISSION_ALREADY_COMPLETED"
                ? "Você já concluiu esta missão."
                : `Missão concluída! +${result.xpAwarded} XP`
            )
            router.refresh()
          } else {
            setMessage(
              result.code === "INCORRECT_ANSWER"
                ? "Palavra-chave incorreta. Tente novamente."
                : result.code === "ATTEMPTS_EXHAUSTED"
                  ? "Você atingiu o limite de tentativas desta missão."
                  : result.code === "PREREQUISITE_MISSING"
                    ? "Conclua os pré-requisitos desta missão."
                    : "Não foi possível concluir. Tente novamente."
            )
            if (result.code === "ATTEMPTS_EXHAUSTED") setFinished(true)
          }
        } catch {
          setIsError(true)
          setMessage("Não foi possível enviar a resposta. Tente novamente.")
        } finally {
          setPending(false)
        }
      }}
    >
      <label htmlFor={inputId} className="text-sm font-medium">
        Palavra-chave
      </label>
      {maxAttempts && (
        <p className="text-sm text-white/70">
          Até {maxAttempts} tentativas. Maiúsculas e acentos não alteram a
          resposta.
        </p>
      )}
      <Input
        id={inputId}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        maxLength={120}
        required
        autoComplete="off"
        disabled={pending || finished}
      />
      <p
        role="status"
        className={`text-sm ${isError ? "text-destructive" : "text-white/70"}`}
      >
        {message}
      </p>
      <Button
        type="submit"
        className="w-full"
        disabled={pending || finished || !answer.trim()}
      >
        {pending ? "Conferindo…" : "Enviar resposta"}
      </Button>
    </form>
  )
}
