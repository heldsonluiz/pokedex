"use client"

import { Check, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { INTERESTS, MAX_PROFILE_INTERESTS } from "./profile-interests"

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

export function InterestSelector({
  value,
  onChange,
  error,
  disabled,
}: Readonly<{
  value: string[]
  onChange: (value: string[]) => void
  error?: string
  disabled?: boolean
}>) {
  const [query, setQuery] = useState("")
  const options = INTERESTS.filter(({ label }) =>
    normalize(label).includes(normalize(query))
  )

  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id]
    )
  }

  return (
    <div className="space-y-3">
      <p id="interests-hint" className="text-xs text-muted-foreground">
        Escolha de 1 a {MAX_PROFILE_INTERESTS} áreas. Você não precisa dominar o
        assunto para selecioná-lo.
      </p>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
        <p className="mb-2 text-sm font-medium" aria-live="polite">
          Suas áreas: {value.length}/{MAX_PROFILE_INTERESTS}
        </p>
        {value.length ? (
          <div className="flex flex-wrap gap-2">
            {value.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                disabled={disabled}
                aria-label={`Remover ${INTERESTS.find((item) => item.id === id)?.label ?? id}`}
                onClick={() => toggle(id)}
              >
                <Check aria-hidden="true" />
                {INTERESTS.find((item) => item.id === id)?.label ?? id}
                <X aria-hidden="true" />
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione uma área abaixo para começar.
          </p>
        )}
      </div>
      <label htmlFor="interest-search" className="sr-only">
        Buscar áreas de interesse
      </label>
      <Input
        id="interest-search"
        placeholder="Buscar assunto ou tecnologia..."
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? "interests-hint interests-error" : "interests-hint"
        }
      />
      <div
        className="flex max-h-72 flex-wrap gap-2 overflow-y-auto p-1"
        role="group"
        aria-label="Áreas disponíveis"
      >
        {options.map(({ id, label }) => {
          const selected = value.includes(id)
          return (
            <Button
              key={id}
              type="button"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              disabled={
                disabled || (!selected && value.length >= MAX_PROFILE_INTERESTS)
              }
              onClick={() => toggle(id)}
            >
              {selected && <Check aria-hidden="true" />}
              {label}
            </Button>
          )
        })}
        {!options.length && (
          <p className="text-sm text-muted-foreground">
            Nenhuma área encontrada. Tente outro termo.
          </p>
        )}
      </div>
      {error && (
        <p
          id="interests-error"
          className="text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
