"use client"

import { Search, X } from "lucide-react"
import { useId, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { findSkillBySlug, searchSkills } from "./profile-skills"

const MAX_VISIBLE_RESULTS = 8
const MAX_SELECTED_SKILLS = 5

type SkillSelectorProps = Readonly<{
  value: string[]
  onChange: (value: string[]) => void
  error?: string
  disabled?: boolean
}>

export function SkillSelector({
  value,
  onChange,
  error,
  disabled = false,
}: SkillSelectorProps) {
  const listboxId = useId()
  const errorId = `${listboxId}-error`
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const results = useMemo(
    () => searchSkills(query, value).slice(0, MAX_VISIBLE_RESULTS),
    [query, value]
  )
  const hasReachedLimit = value.length >= MAX_SELECTED_SKILLS

  function selectSkill(slug: string) {
    if (hasReachedLimit || value.includes(slug)) {
      return
    }

    onChange([...value, slug])
    setQuery("")
    setIsOpen(false)
  }

  function removeSkill(slug: string) {
    onChange(value.filter((selectedSlug) => selectedSlug !== slug))
  }

  const shouldShowResults = isOpen && query.trim().length > 0

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap gap-2"
        aria-label="Habilidades selecionadas"
      >
        {value.map((slug) => {
          const skill = findSkillBySlug(slug)

          if (!skill) {
            return null
          }

          return (
            <Badge
              variant="secondary"
              className="h-10 gap-1.5 border border-primary bg-transparent px-3 py-1 pr-1 pl-3 text-sm text-foreground"
              key={slug}
            >
              {skill.name}
              <button
                type="button"
                className="inline-flex size-8 touch-manipulation items-center justify-center rounded-full hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`Remover ${skill.name}`}
                disabled={disabled}
                onClick={() => removeSkill(slug)}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </Badge>
          )
        })}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-9"
          value={query}
          placeholder={
            hasReachedLimit
              ? "Limite de 5 habilidades atingido"
              : "Pesquise por nome ou alias"
          }
          role="combobox"
          aria-label="Pesquisar habilidades"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={shouldShowResults}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled || hasReachedLimit}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false)
            }
          }}
        />

        {shouldShowResults && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {results.length > 0 ? (
              results.map((skill) => (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="flex min-h-11 w-full touch-manipulation items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  key={skill.slug}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSkill(skill.slug)}
                >
                  <span>{skill.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {skill.category}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Nenhuma habilidade encontrada.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Selecione entre 3 e 5 habilidades.
        </p>
        <p className="text-xs text-muted-foreground">{value.length}/5</p>
      </div>

      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
