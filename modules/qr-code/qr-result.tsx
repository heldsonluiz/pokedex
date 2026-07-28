import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QrResultStatus = "error" | "loading" | "success"

export function QrResult({
  status,
  title,
  description,
  children,
}: Readonly<{
  status: QrResultStatus
  title: string
  description: string
  children?: ReactNode
}>) {
  const Icon =
    status === "loading"
      ? LoaderCircle
      : status === "success"
        ? CheckCircle2
        : AlertCircle

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <span
        className={cn(
          "rounded-full p-4",
          status === "success" && "bg-success/10 text-success",
          status === "error" && "bg-destructive/10 text-destructive",
          status === "loading" && "bg-secondary/10 text-secondary"
        )}
      >
        <Icon
          className={cn("size-8", status === "loading" && "animate-spin")}
          aria-hidden="true"
        />
      </span>

      <div
        className="max-w-sm space-y-2"
        role={status === "error" ? "alert" : "status"}
      >
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {children}

      {status !== "loading" && (
        <Link
          href="/home"
          className={buttonVariants({
            variant: children ? "outline" : "default",
          })}
        >
          Voltar para o início
        </Link>
      )}
    </main>
  )
}
