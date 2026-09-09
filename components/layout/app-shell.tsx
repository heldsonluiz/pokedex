import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppShellProps = {
  children: ReactNode
  header?: ReactNode
  navigation?: ReactNode
  theme?: "light" | "dark"
  className?: string
  contentClassName?: string
}

export function AppShell({
  children,
  header,
  navigation,
  theme = "light",
  className,
  contentClassName,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "h-dvh w-full overflow-hidden bg-(image:--gradient-page-backdrop)",
        theme === "dark" && "dark",
        className
      )}
    >
      <div className="mx-auto flex h-dvh w-full max-w-107.5 min-w-0 flex-col overflow-hidden bg-background text-foreground shadow-2xl">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-[max(1rem,env(safe-area-inset-top))] focus:left-1/2 focus:z-50 focus:-translate-x-1/2 focus:rounded-lg focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:ring-2 focus:ring-ring"
        >
          Pular para o conteúdo
        </a>
        {header}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain motion-safe:scroll-smooth",
            contentClassName
          )}
        >
          {children}
        </main>
        {navigation}
      </div>
    </div>
  )
}
