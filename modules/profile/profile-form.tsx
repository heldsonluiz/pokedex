"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
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
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<UpdateProfileActionResult | null>(null)
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema, undefined, { raw: true }),
    defaultValues,
  })
  const onSubmit = handleSubmit((values) => {
    setResult(null)

    startTransition(async () => {
      const actionResult = await submitAction(values)
      setResult(actionResult)

      if (actionResult.success) {
        router.replace(successRedirect)
        return
      }

      if (actionResult.fieldErrors) {
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
  })

  function handleCancel() {
    if (cancelAction) {
      startTransition(cancelAction)
      return
    }

    router.replace(cancelHref)
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </form>
  )
}
