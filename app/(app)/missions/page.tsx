import {
  CheckCircle2,
  CircleDot,
  LockKeyhole,
  QrCode,
  ScanLine,
  ShieldCheck,
  Target,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/layout/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import {
  listMissionsForSession,
  listReviewableMissionsForSession,
} from "@/modules/missions/mission.service"

export const metadata: Metadata = { title: "Missões" }
export const dynamic = "force-dynamic"

type MissionsPageProps = Readonly<{
  searchParams: Promise<{
    reviewResult?: string
    participant?: string
    mission?: string
    xp?: string
  }>
}>

export default async function MissionsPage({
  searchParams,
}: MissionsPageProps) {
  const session = await requireAuth()
  const [missions, reviewableMissions, resultParams] = await Promise.all([
    listMissionsForSession(session),
    listReviewableMissionsForSession(session),
    searchParams,
  ])

  if (reviewableMissions) {
    return (
      <div className="space-y-6 p-6">
        <section className="space-y-1">
          <Badge variant="secondary">
            <ShieldCheck aria-hidden="true" />
            Área da organização
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Validar missões</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Escolha a missão realizada e depois leia o QR Code do participante.
          </p>
        </section>

        {resultParams.reviewResult && <ReviewFeedback params={resultParams} />}

        <MissionReviewerList missions={reviewableMissions} />
      </div>
    )
  }

  if (missions.length === 0) {
    return (
      <EmptyState
        icon={<Target className="size-8" aria-hidden="true" />}
        title="Nenhuma missão disponível"
        description="As missões aparecerão aqui quando forem liberadas."
      />
    )
  }

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Missões</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Complete os desafios do evento para acumular XP.
        </p>
      </section>

      <section className="space-y-3" aria-label="Lista de missões">
        {missions.map((mission) => {
          const completed = mission.status === "completed"
          const blocked = mission.status === "blocked"
          const StatusIcon = completed
            ? CheckCircle2
            : blocked
              ? LockKeyhole
              : CircleDot

          return (
            <Card
              key={mission.id}
              className={cn(
                "transition-colors",
                completed && "bg-primary/8 ring-primary/25 dark:bg-primary/10",
                blocked && "bg-muted/50 opacity-70 ring-border",
                mission.status === "available" &&
                  "bg-[linear-gradient(135deg,rgba(139,255,61,0.10)_0%,transparent_42%)] shadow-sm shadow-[#8BFF3D]/10 ring-[#8BFF3D]/55"
              )}
            >
              <CardHeader>
                <CardTitle>{mission.title}</CardTitle>
                <CardDescription>{mission.description}</CardDescription>
                <CardAction>
                  <StatusIcon
                    className={
                      completed
                        ? "size-5 text-primary"
                        : blocked
                          ? "size-5 text-muted-foreground"
                          : "size-5 text-[#3F7800] dark:text-[#8BFF3D]"
                    }
                    aria-hidden="true"
                  />
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    variant={completed ? "default" : "outline"}
                    className={
                      mission.status === "available"
                        ? "border-[#65C21B]/50 bg-[#8BFF3D]/30 text-[#3F7800] dark:border-[#8BFF3D]/50 dark:text-[#C5FF9D]"
                        : undefined
                    }
                  >
                    {completed
                      ? "Concluída"
                      : blocked
                        ? "Bloqueada"
                        : mission.validationType === "reviewer"
                          ? "Disponível · validação presencial"
                          : "Disponível · encontre o QR Code"}
                  </Badge>
                  <span className="text-sm font-medium text-primary">
                    +{mission.xpAwarded} XP
                  </span>
                </div>

                {blocked && (
                  <div className="rounded-lg bg-background/70 p-3">
                    <p className="text-xs font-medium">
                      Para desbloquear, conclua:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {mission.blockedBy.map((prerequisite) => (
                        <li
                          key={`${prerequisite.type}:${prerequisite.label}`}
                          className="flex gap-2"
                        >
                          <LockKeyhole
                            className="mt-0.5 size-3 shrink-0"
                            aria-hidden="true"
                          />
                          {prerequisite.type === "company"
                            ? `Visite ${prerequisite.label}`
                            : `Complete “${prerequisite.label}”`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {mission.status === "available" &&
                  mission.validationType === "reviewer" && (
                    <Button
                      variant="outline"
                      className="w-full border-[#65C21B]/50 text-[#3F7800] hover:bg-[#8BFF3D]/10 hover:text-[#315F00] dark:border-[#8BFF3D]/50 dark:text-[#C5FF9D] dark:hover:bg-[#8BFF3D]/10 dark:hover:text-[#DCFFC7]"
                      render={<Link href="/profile/qr-code?source=missions" />}
                      nativeButton={false}
                    >
                      <QrCode data-icon="inline-start" aria-hidden="true" />
                      Exibir meu QR Code
                    </Button>
                  )}
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}

function ReviewFeedback({
  params,
}: Readonly<{
  params: Awaited<MissionsPageProps["searchParams"]>
}>) {
  const success =
    params.reviewResult === "MISSION_COMPLETED" ||
    params.reviewResult === "MISSION_ALREADY_COMPLETED"
  const descriptions: Record<string, string> = {
    FORBIDDEN: "Sua conta não tem permissão para validar missões.",
    INVALID_QR: "O QR Code do participante não pôde ser validado.",
    MISSION_INACTIVE: "Esta missão não está mais disponível.",
    MISSION_NOT_FOUND: "A missão selecionada não foi encontrada.",
    PREREQUISITE_MISSING: "O participante ainda não cumpriu os pré-requisitos.",
    PROFILE_UNAVAILABLE: "O perfil do participante não está disponível.",
    QR_EXPIRED: "O QR Code expirou. Peça ao participante para atualizá-lo.",
    WRONG_VALIDATION_TYPE: "Esta missão não aceita validação presencial.",
  }

  return (
    <div
      role={success ? "status" : "alert"}
      className={
        success
          ? "rounded-xl bg-primary/10 p-4 text-sm text-primary"
          : "rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
      }
    >
      {params.reviewResult === "MISSION_COMPLETED"
        ? `${params.participant} concluiu “${params.mission}” e recebeu ${params.xp} XP.`
        : params.reviewResult === "MISSION_ALREADY_COMPLETED"
          ? `${params.participant} já havia concluído “${params.mission}”. Nenhum XP adicional foi concedido.`
          : (descriptions[params.reviewResult ?? ""] ??
            "Não foi possível validar a missão. Tente novamente.")}
    </div>
  )
}

function MissionReviewerList({
  missions,
}: Readonly<{
  missions: Awaited<ReturnType<typeof listReviewableMissionsForSession>>
}>) {
  if (!missions?.length) {
    return (
      <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        Não há missões presenciais disponíveis para validação.
      </p>
    )
  }

  return (
    <section className="space-y-3" aria-label="Missões para validação">
      {missions.map((mission) => (
        <Card key={mission.id}>
          <CardHeader>
            <CardTitle>{mission.title}</CardTitle>
            <CardDescription>{mission.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-primary">
              +{mission.xpAwarded} XP
            </span>
            <Button
              render={
                <Link
                  href={`/missions/review/${encodeURIComponent(mission.id)}`}
                />
              }
              nativeButton={false}
            >
              <ScanLine data-icon="inline-start" aria-hidden="true" />
              Validar
            </Button>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
