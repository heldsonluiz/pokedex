"use client"

import { ChevronLeft } from "lucide-react"
import Link from "next/link"
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
  return (
    <header
      className={cn(
        "flex min-h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm",
        className
      )}
    >
      {showBack && (
        <Link
          href={backHref ?? "/home"}
          replace
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        {greeting && (
          <p className="truncate text-xs text-muted-foreground">{greeting}</p>
        )}
        <p className="truncate text-lg font-bold tracking-tight">{title}</p>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </header>
  )
}
