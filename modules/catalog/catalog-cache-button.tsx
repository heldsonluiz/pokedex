"use client"

import { LoaderCircle, RefreshCw } from "lucide-react"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"

import {
  type CatalogCacheActionState,
  invalidateCatalogCacheAction,
} from "./catalog-cache.actions"

const initialState: CatalogCacheActionState = { success: false }

export function CatalogCacheButton() {
  const [state, formAction, isPending] = useActionState(
    invalidateCatalogCacheAction,
    initialState
  )

  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RefreshCw className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Atualizar catálogos</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Use após alterar empresas, tags, missões, brindes, palestrantes ou
            palestras no painel administrativo.
          </p>
        </div>
      </div>

      <form action={formAction}>
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw aria-hidden="true" />
          )}
          {isPending ? "Atualizando..." : "Limpar cache dos catálogos"}
        </Button>
      </form>

      {state.message && (
        <p
          role="status"
          className={
            state.success ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}
    </div>
  )
}
