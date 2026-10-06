"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import type { UpdateProfileActionResult } from "./profile.actions"
import {
  GENDER_OPTIONS,
  type ProfileUpdateInput,
  profileUpdateSchema,
} from "./profile.schema"
import { INTERESTS } from "./profile-interests"
import { SkillSelector } from "./skill-selector"

type ProfileFormProps = Readonly<{
  defaultValues: ProfileUpdateInput
  submitAction: (input: unknown) => Promise<UpdateProfileActionResult>
  successRedirect: string
}> &
  (
    | {
        cancelHref: string
        cancelAction?: never
      }
    | {
        cancelHref?: never
        cancelAction: () => Promise<void>
      }
  )

const BASIC_FIELDS = [
  "displayName",
  "gender",
  "bio",
  "role",
  "company",
  "linkedinUsername",
  "website",
] as const

function FieldError({
  id,
  message,
}: Readonly<{ id: string; message?: string }>) {
  if (!message) {
    return null
  }

  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function ProfileForm({
  defaultValues,
  submitAction,
  successRedirect,
  cancelHref,
  cancelAction,
}: ProfileFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const stepTitle = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    stepTitle.current?.focus({ preventScroll: true })
    stepTitle.current?.scrollIntoView({ block: "start" })
  }, [step])
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<UpdateProfileActionResult | null>(null)
  const {
    control,
    register,
    handleSubmit,
    setError,
    trigger,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema, undefined, { raw: true }),
    defaultValues,
    shouldFocusError: false,
  })
  const onSubmit = handleSubmit(
    (values) => {
      setResult(null)

      startTransition(async () => {
        const actionResult = await submitAction(values)
        setResult(actionResult)

        if (actionResult.success) {
          router.replace(successRedirect)
          return
        }

        if (actionResult.fieldErrors) {
          setStep(
            BASIC_FIELDS.some((field) =>
              Boolean(actionResult.fieldErrors?.[field])
            )
              ? 1
              : 2
          )
          for (const [field, message] of Object.entries(
            actionResult.fieldErrors
          )) {
            setError(field as keyof ProfileUpdateInput, {
              type: "server",
              message,
            })
          }
        }
      })
    },
    (validationErrors) => {
      setStep(
        BASIC_FIELDS.some((field) => Boolean(validationErrors[field])) ? 1 : 2
      )
    }
  )

  async function advance() {
    setResult(null)
    if (await trigger([...BASIC_FIELDS], { shouldFocus: true })) setStep(2)
  }

  function handleCancel() {
    if (cancelAction) {
      startTransition(cancelAction)
      return
    }

    router.replace(cancelHref)
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        if (step === 1) {
          event.preventDefault()
          void advance()
        } else {
          void onSubmit(event)
        }
      }}
      noValidate
    >
      <section className="space-y-2" aria-label="Etapas do perfil">
        <p
          className="text-xs font-medium text-muted-foreground"
          aria-live="polite"
        >
          Etapa {step} de 2
        </p>
        <h2
          ref={stepTitle}
          tabIndex={-1}
          className="scroll-mt-6 text-lg font-semibold outline-none"
        >
          {step === 1
            ? "Informações pessoais e profissionais"
            : "Habilidades e interesses"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {step === 1
            ? "Informe seus dados e como as pessoas podem conhecer você."
            : "Selecione de 3 a 5 habilidades e, se quiser, até 5 interesses."}
        </p>
        <div className="flex gap-2" aria-hidden="true">
          <span className="h-1 flex-1 rounded-full bg-primary" />
          <span
            className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-primary" : "bg-muted"}`}
          />
        </div>
      </section>
      <fieldset hidden={step !== 1} disabled={isPending} className="space-y-6">
        <legend className="sr-only">
          Informações pessoais e profissionais
        </legend>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="display-name">
            Nome
          </label>
          <Input
            id="display-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={
              errors.displayName ? "display-name-error" : undefined
            }
            {...register("displayName")}
          />
          <FieldError
            id="display-name-error"
            message={errors.displayName?.message}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="gender">
            Gênero
          </label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="gender"
                  className="w-full"
                  aria-invalid={Boolean(errors.gender)}
                  aria-describedby={errors.gender ? "gender-error" : undefined}
                >
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="gender-error" message={errors.gender?.message} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium" htmlFor="bio">
              Biografia
            </label>
            <span className="text-xs text-muted-foreground">
              Opcional · até 200 caracteres
            </span>
          </div>
          <Textarea
            id="bio"
            rows={4}
            maxLength={200}
            aria-invalid={Boolean(errors.bio)}
            aria-describedby={errors.bio ? "bio-error" : undefined}
            {...register("bio")}
          />
          <FieldError id="bio-error" message={errors.bio?.message} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="role">
              Cargo ou atuação
            </label>
            <span className="sr-only">Opcional</span>
            <Input
              id="role"
              autoComplete="organization-title"
              maxLength={80}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? "role-error" : undefined}
              {...register("role")}
            />
            <FieldError id="role-error" message={errors.role?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="company">
              Empresa
            </label>
            <span className="sr-only">Opcional</span>
            <Input
              id="company"
              autoComplete="organization"
              maxLength={100}
              aria-invalid={Boolean(errors.company)}
              aria-describedby={errors.company ? "company-error" : undefined}
              {...register("company")}
            />
            <FieldError id="company-error" message={errors.company?.message} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium" htmlFor="linkedin-username">
              LinkedIn
            </label>
            <span className="text-xs text-muted-foreground">Opcional</span>
          </div>
          <div className="flex h-11 overflow-hidden rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-destructive/20 dark:bg-input/30">
            <span className="flex shrink-0 items-center border-r border-input bg-muted/60 px-3 text-sm text-muted-foreground">
              www.linkedin.com/in/
            </span>
            <Input
              id="linkedin-username"
              className="h-full min-w-0 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="seu-usuario"
              aria-invalid={Boolean(errors.linkedinUsername)}
              aria-describedby={
                errors.linkedinUsername ? "linkedin-username-error" : undefined
              }
              {...register("linkedinUsername")}
            />
          </div>
          <FieldError
            id="linkedin-username-error"
            message={errors.linkedinUsername?.message}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium" htmlFor="website">
              Website
            </label>
            <span className="text-xs text-muted-foreground">Opcional</span>
          </div>
          <Input
            id="website"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="www.meu-website.com"
            aria-invalid={Boolean(errors.website)}
            aria-describedby={errors.website ? "website-error" : undefined}
            {...register("website")}
          />
          <FieldError id="website-error" message={errors.website?.message} />
        </div>
      </fieldset>
      <fieldset hidden={step !== 2} disabled={isPending} className="space-y-6">
        <legend className="sr-only">Habilidades e interesses</legend>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Habilidades</legend>
          <Controller
            control={control}
            name="skills"
            render={({ field, fieldState }) => (
              <SkillSelector
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={isPending}
              />
            )}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Interesses (opcional)</legend>
          <p className="text-xs text-muted-foreground">
            Escolha até 5 interesses para participar das missões de networking.
          </p>
          <Controller
            control={control}
            name="interests"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(({ id, label }) => {
                  const selected = (field.value ?? []).includes(id)
                  return (
                    <Button
                      key={id}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      aria-pressed={selected}
                      disabled={
                        isPending ||
                        (!selected && (field.value ?? []).length >= 5)
                      }
                      onClick={() =>
                        field.onChange(
                          selected
                            ? (field.value ?? []).filter(
                                (value) => value !== id
                              )
                            : [...(field.value ?? []), id]
                        )
                      }
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
            )}
          />
          <FieldError
            id="interests-error"
            message={errors.interests?.message}
          />
        </fieldset>
      </fieldset>

      {result && !result.success && !result.fieldErrors && (
        <p className="text-sm text-destructive" role="alert">
          {result.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleCancel}
        >
          Cancelar
        </Button>
        {step === 1 ? (
          <Button
            key="next"
            type="button"
            disabled={isPending}
            onClick={() => void advance()}
          >
            Continuar
          </Button>
        ) : (
          <Button key="save" type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar perfil"}
          </Button>
        )}
        {step === 2 && (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            className="col-span-2"
            onClick={() => {
              setResult(null)
              setStep(1)
            }}
          >
            Voltar para informações
          </Button>
        )}
      </div>
    </form>
  )
}
