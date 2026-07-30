import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type EmptyStateProps = Readonly<{
  icon: ReactNode
  title: string
  description: string
  className?: string
  action?: ReactNode
  headingLevel?: "h1" | "h2"
}>

export function EmptyState({
  icon,
  title,
  description,
  className,
  action,
  headingLevel: Heading = "h1",
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center",
        className
      )}
    >
      <span className="rounded-full bg-primary/10 p-4 text-primary">
        {icon}
      </span>
      <div className="max-w-sm space-y-2">
        <Heading className="text-xl font-semibold">{title}</Heading>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </section>
  )
}
