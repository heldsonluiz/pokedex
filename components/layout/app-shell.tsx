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
        "min-h-dvh bg-(image:--gradient-page-backdrop)",
        theme === "dark" && "dark",
        className
      )}
    >
      <div className="mx-auto flex h-dvh w-full max-w-107.5 flex-col overflow-hidden bg-background text-foreground shadow-2xl">
        {header}
        <main
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-y-contain",
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
