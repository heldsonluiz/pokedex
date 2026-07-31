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
  actionHref = "/home",
  actionLabel = "Voltar para o início",
  secondaryActionHref,
  secondaryActionLabel,
  icon,
}: Readonly<{
  status: QrResultStatus
  title: string
  description: string
  children?: ReactNode
  actionHref?: string
  actionLabel?: string
  secondaryActionHref?: string
  secondaryActionLabel?: string
  icon?: ReactNode
}>) {
  const Icon =
    status === "loading"
      ? LoaderCircle
      : status === "success"
        ? CheckCircle2
        : AlertCircle

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_45%)] p-6">
      <section className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-card p-6 text-center shadow-card ring-1 ring-foreground/10">
        <span
          className={cn(
            "flex items-center justify-center",
            icon ? "size-28 rounded-3xl" : "size-16 rounded-2xl",
            status === "success" &&
              "bg-[#8BFF3D]/15 text-[#3F7800] shadow-[0_0_22px_rgb(139_255_61/0.2)] dark:text-[#AFFF78]",
            status === "error" && "bg-destructive/10 text-destructive",
            status === "loading" &&
              "bg-primary/10 text-primary shadow-[0_0_22px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
          )}
        >
          {icon ?? (
            <Icon
              className={cn("size-8", status === "loading" && "animate-spin")}
              aria-hidden="true"
            />
          )}
        </span>

        <div
          className="space-y-2"
          role={status === "error" ? "alert" : "status"}
        >
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {children}

        {status !== "loading" && (
          <div className="grid w-full gap-2">
            {secondaryActionHref && secondaryActionLabel && (
              <Link
                href={secondaryActionHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full"
                )}
              >
                {secondaryActionLabel}
              </Link>
            )}
            <Link
              href={actionHref}
              className={cn(
                buttonVariants({
                  variant: children ? "outline" : "default",
                  size: "lg",
                }),
                "w-full"
              )}
            >
              {actionLabel}
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
