"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import type { UpdateProfileActionResult } from "./profile.actions"
import { type ProfileUpdateInput, profileUpdateSchema } from "./profile.schema"
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
        router.push(successRedirect)
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

    router.push(cancelHref)
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
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium" htmlFor="bio">
            Biografia
          </label>
          <span className="text-xs text-muted-foreground">
            Até 200 caracteres
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
        <label className="text-sm font-medium" htmlFor="link">
          Link
        </label>
        <Input
          id="link"
          type="url"
          inputMode="url"
          placeholder="https://"
          aria-invalid={Boolean(errors.link)}
          aria-describedby={errors.link ? "link-error" : undefined}
          {...register("link")}
        />
        <FieldError id="link-error" message={errors.link?.message} />
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
