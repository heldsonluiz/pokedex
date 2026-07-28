"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppHeaderProps = {
  title: string
  greeting?: string
  actions?: ReactNode
  showBack?: boolean
  backHref?: string
  className?: string
}

export function AppHeader({
  title,
  greeting,
  actions,
  showBack = false,
  backHref,
  className,
}: AppHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        "flex min-h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur-sm",
        className
      )}
    >
      {showBack && (
        <button
          type="button"
          className="-ml-2 inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Voltar"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        {greeting && (
          <p className="truncate text-xs text-muted-foreground">{greeting}</p>
        )}
        <h1 className="truncate text-lg font-semibold">{title}</h1>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </header>
  )
}
