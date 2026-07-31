"use client"

import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  LockKeyhole,
  QrCode,
  Sparkles,
  Target,
} from "lucide-react"
import Link from "next/link"
import type { ReactElement } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { MissionListItem } from "./mission.service"
import {
  orderMissionsForDisplay,
  selectFeaturedMission,
} from "./mission-presentation"

const statusContent = {
  available: { label: "Disponível", icon: CircleDot },
  blocked: { label: "Bloqueada", icon: LockKeyhole },
  completed: { label: "Concluída", icon: CheckCircle2 },
} as const

export function MissionParticipantExperience({
  missions,
}: Readonly<{ missions: MissionListItem[] }>) {
  const orderedMissions = orderMissionsForDisplay(missions)
  const featuredMission = selectFeaturedMission(missions)
  const completedCount = missions.filter(
    (mission) => mission.status === "completed"
  ).length
  const progress = Math.round((completedCount / missions.length) * 100)

  return (
    <div className="space-y-6">
      <section className="space-y-2" aria-label="Progresso das missões">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium">Seu progresso</p>
          <p className="text-muted-foreground tabular-nums">
            {completedCount} de {missions.length} concluídas
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Missões concluídas"
          aria-valuemin={0}
          aria-valuemax={missions.length}
          aria-valuenow={completedCount}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="featured-mission-title">
        <h2
          id="featured-mission-title"
          className="text-sm font-semibold text-muted-foreground"
        >
          Em destaque
        </h2>
        {featuredMission ? (
          <FeaturedMission mission={featuredMission} />
        ) : (
          <div className="flex items-center gap-4 rounded-3xl bg-(image:--gradient-primary-card) p-5 text-primary-foreground shadow-glow-primary">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold">Todas as missões concluídas</h3>
              <p className="mt-1 text-sm text-primary-foreground/75">
                Você completou todos os desafios disponíveis.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="all-missions-title">
        <h2 id="all-missions-title" className="text-lg font-semibold">
          Todas as missões
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          {orderedMissions.map((mission) => (
            <MissionRow key={mission.id} mission={mission} />
          ))}
        </div>
      </section>
    </div>
  )
}

function FeaturedMission({ mission }: Readonly<{ mission: MissionListItem }>) {
  const blocked = mission.status === "blocked"

  return (
    <MissionDialog
      mission={mission}
      trigger={
        <button
          type="button"
          className={cn(
            "group w-full rounded-3xl p-5 text-left shadow-card transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]",
            blocked
              ? "bg-card ring-1 ring-border"
              : "bg-(image:--gradient-immersive) text-white"
          )}
        >
          <div className="flex items-start gap-4">
            <MissionImage mission={mission} featured />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-xs font-medium",
                  blocked ? "text-muted-foreground" : "text-white/65"
                )}
              >
                {blocked ? "Próxima a desbloquear" : "Disponível agora"}
              </p>
              <h3 className="mt-1 font-semibold">{mission.title}</h3>
              <p
                className={cn(
                  "mt-1 line-clamp-2 text-sm leading-5",
                  blocked ? "text-muted-foreground" : "text-white/70"
                )}
              >
                {mission.description}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    blocked
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/25 text-white"
                  )}
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />+
                  {mission.xpAwarded} XP
                </span>
                <ChevronRight
                  className={cn(
                    "size-5",
                    blocked ? "text-muted-foreground" : "text-white/70"
                  )}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </button>
      }
    />
  )
}

function MissionRow({ mission }: Readonly<{ mission: MissionListItem }>) {
  const status = statusContent[mission.status]
  const StatusIcon = status.icon
  const firstBlocker = mission.blockedBy[0]

  return (
    <MissionDialog
      mission={mission}
      trigger={
        <button
          type="button"
          className={cn(
            "flex min-h-18 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
            mission.status === "completed" && "bg-primary/5",
            mission.status === "blocked" && "opacity-70"
          )}
        >
          <MissionImage mission={mission} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {mission.title}
            </span>
            {firstBlocker ? (
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                Requer: {formatBlocker(firstBlocker)}
                {mission.blockedBy.length > 1 &&
                  ` e mais ${mission.blockedBy.length - 1}`}
              </span>
            ) : (
              <span className="mt-1 block text-xs text-muted-foreground">
                {mission.validationType === "reviewer"
                  ? "Validação presencial"
                  : "Encontre o QR Code"}
              </span>
            )}
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-xs font-semibold text-primary">
              +{mission.xpAwarded} XP
            </span>
            <span
              className={cn(
                "mt-1 flex items-center justify-end",
                mission.status === "available" &&
                  "text-[#00788A] drop-shadow-[0_0_6px_#00E5FF] dark:text-[#66F3FF]",
                mission.status === "blocked" && "text-muted-foreground",
                mission.status === "completed" && "text-success"
              )}
            >
              <StatusIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">{status.label}</span>
            </span>
          </span>
        </button>
      }
    />
  )
}

function MissionImage({
  mission,
  featured = false,
  dialog = false,
}: Readonly<{
  mission: MissionListItem
  featured?: boolean
  dialog?: boolean
}>) {
  return (
    <Avatar
      className={cn(
        "rounded-xl",
        dialog ? "size-28" : featured ? "size-16" : "size-11"
      )}
    >
      {mission.status === "completed" && mission.imageUrl && (
        <AvatarImage
          src={mission.imageUrl}
          alt=""
          className="rounded-xl object-cover"
        />
      )}
      <AvatarFallback
        className={cn(
          "rounded-xl",
          mission.status === "available" &&
            "bg-[#00E5FF]/15 text-[#00788A] shadow-[0_0_18px_color-mix(in_oklab,#00E5FF_20%,transparent)] dark:text-[#66F3FF]",
          mission.status === "completed" && "bg-success/15 text-success"
        )}
      >
        {mission.status === "blocked" ? (
          <LockKeyhole aria-hidden="true" />
        ) : mission.status === "completed" ? (
          <CheckCircle2 aria-hidden="true" />
        ) : (
          <Target aria-hidden="true" />
        )}
      </AvatarFallback>
    </Avatar>
  )
}

function MissionDialog({
  mission,
  trigger,
}: Readonly<{ mission: MissionListItem; trigger: ReactElement }>) {
  const status = statusContent[mission.status]
  const StatusIcon = status.icon

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader className="px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <MissionImage mission={mission} dialog />
            <div className="min-w-0">
              <Badge
                variant={mission.status === "completed" ? "default" : "outline"}
              >
                <StatusIcon aria-hidden="true" />
                {status.label}
              </Badge>
              <DialogTitle className="mt-2 text-lg leading-snug">
                {mission.title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2 leading-6 whitespace-pre-wrap">
            {mission.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-muted p-3">
            <span className="text-sm text-muted-foreground">Recompensa</span>
            <span className="font-semibold text-primary">
              +{mission.xpAwarded} XP
            </span>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <p className="text-sm font-medium">Como concluir</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {mission.validationType === "reviewer"
                ? "Realize a atividade e apresente seu QR Code para uma pessoa da organização."
                : "Encontre e leia o QR Code desta missão durante o evento."}
            </p>
          </div>
          {mission.blockedBy.length > 0 && (
            <div className="rounded-xl border border-border p-3">
              <p className="text-sm font-medium">Para desbloquear, conclua:</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {mission.blockedBy.map((prerequisite) => (
                  <li
                    key={`${prerequisite.type}:${prerequisite.label}`}
                    className="flex gap-2"
                  >
                    <LockKeyhole
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {formatBlocker(prerequisite)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row">
          <DialogClose render={<Button variant="outline" className="flex-1" />}>
            Fechar
          </DialogClose>
          {mission.status === "available" &&
            mission.validationType === "reviewer" && (
              <Button
                className="flex-1"
                render={<Link href="/profile/qr-code?source=missions" />}
                nativeButton={false}
              >
                <QrCode aria-hidden="true" />
                Meu QR Code
              </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatBlocker(prerequisite: MissionListItem["blockedBy"][number]) {
  return prerequisite.type === "company"
    ? `Visite ${prerequisite.label}`
    : `Complete “${prerequisite.label}”`
}
