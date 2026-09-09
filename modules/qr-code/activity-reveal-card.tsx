import { Building2, CheckCircle2, Tags, Target } from "lucide-react"
import Link from "next/link"

import { AchievementConfetti } from "@/components/motion/achievement-confetti"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const appearances = {
  tag: {
    icon: Tags,
    label: "Encontrada",
    accent: "text-violet-300",
    badge: "border-violet-300/25 bg-violet-400/15 text-violet-200",
    detail: "Tag encontrada",
    message: "Ela está na sua coleção.",
  },
  mission: {
    icon: Target,
    label: "Concluída",
    accent: "text-orange-300",
    badge: "border-orange-300/25 bg-orange-400/15 text-orange-200",
    detail: "Missão concluída",
    message: "Seu progresso foi registrado.",
  },
  company: {
    icon: Building2,
    label: "Visitada",
    accent: "text-lime-300",
    badge: "border-lime-300/25 bg-lime-400/15 text-lime-200",
    detail: "Visita registrada",
    message: "O carimbo está no seu passaporte.",
  },
} as const

export function ActivityRevealCard({
  kind,
  title,
  description,
  imageUrl,
  xpAwarded,
  repeated,
  href,
  actionLabel,
}: Readonly<{
  kind: keyof typeof appearances
  title: string
  description?: string | null
  imageUrl?: string | null
  xpAwarded: number
  repeated: boolean
  href: string
  actionLabel: string
}>) {
  const appearance = appearances[kind]
  const Icon = appearance.icon
  const linkClass =
    "flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#070b18] bg-[radial-gradient(ellipse_at_top,#2e1065,transparent_65%)] px-4 py-6">
      <section
        className="relative isolate w-full max-w-sm overflow-hidden rounded-3xl bg-[#070b18] text-white shadow-2xl ring-1 ring-white/15"
        aria-label="Resultado da leitura"
      >
        {!repeated && <AchievementConfetti />}
        <div className="flex min-h-64 items-center justify-center p-8">
          <Avatar className="size-40 rounded-2xl bg-transparent">
            {imageUrl && (
              <AvatarImage
                src={imageUrl}
                alt={title}
                className="rounded-2xl object-contain"
              />
            )}
            <AvatarFallback className="rounded-2xl bg-white/5">
              <Icon
                className={cn("size-16", appearance.accent)}
                aria-hidden="true"
              />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="relative -mt-5 space-y-4 rounded-t-[2rem] bg-[#0d1324] p-4 pt-6">
          <div className="flex items-start gap-3" role="status">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full border",
                appearance.badge
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl leading-snug font-semibold">{title}</h1>
              <span
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                  appearance.badge
                )}
              >
                <CheckCircle2 className="size-3" aria-hidden="true" />
                {appearance.label}
              </span>
            </div>
          </div>
          {description && (
            <p className="text-sm leading-6 whitespace-pre-wrap text-white/65">
              {description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
            <div className="bg-white/5 p-4">
              <p className="text-xs font-medium text-white/50">
                {repeated ? "XP já recebido" : "Recompensa"}
              </p>
              <p className={cn("mt-2 text-xl font-bold", appearance.accent)}>
                {repeated ? "" : "+"}
                {xpAwarded} XP
              </p>
            </div>
            <div className="bg-white/5 p-4">
              <p className="text-xs font-medium">{appearance.detail}</p>
              <p className="mt-2 text-sm leading-5 text-white/60">
                {repeated
                  ? "Você já registrou esta atividade. Nenhum XP adicional foi concedido."
                  : appearance.message}
              </p>
            </div>
          </div>
          <div className="grid gap-2 pt-2">
            <Link href={href} replace className={linkClass}>
              {actionLabel}
            </Link>
            <Link href="/scan" replace className={linkClass}>
              Ler outro QR
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
