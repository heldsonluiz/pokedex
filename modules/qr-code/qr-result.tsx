import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { AchievementConfetti } from "@/components/motion/achievement-confetti"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QrResultStatus = "error" | "loading" | "success"

export function QrResult({
  status,
  celebrate = false,
  appearance = "default",
  title,
  subtitle,
  description,
  children,
  actionHref = "/home",
  actionLabel = "Voltar para o início",
  secondaryActionHref,
  secondaryActionLabel,
  icon,
}: Readonly<{
  appearance?: "default" | "reveal"
  celebrate?: boolean
  status: QrResultStatus
  title: string
  subtitle?: string
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
    <main
      className={cn(
        "flex min-h-dvh items-center justify-center p-6",
        appearance === "reveal"
          ? "bg-[#070b18] bg-[radial-gradient(ellipse_at_top,#2e1065,transparent_65%)]"
          : "bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_45%)]"
      )}
    >
      <section
        className={cn(
          "relative isolate flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-card p-6 text-center text-card-foreground shadow-card ring-1 ring-foreground/10",
          appearance === "reveal" && "qr-reveal-card shadow-2xl"
        )}
      >
        {celebrate && status === "success" && <AchievementConfetti />}
        <span
          className={cn(
            "flex items-center justify-center",
            icon ? "size-28 rounded-3xl" : "size-16 rounded-2xl",
            status === "success" &&
              "bg-[#8BFF3D]/15 text-[#3F7800] shadow-[0_0_22px_rgb(139_255_61/0.2)]",
            appearance !== "reveal" &&
              status === "success" &&
              "dark:text-[#AFFF78]",
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
          {subtitle && (
            <p className="mx-auto mb-4 text-sm leading-6 text-primary">
              {subtitle}
            </p>
          )}
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
                replace
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
              replace
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
