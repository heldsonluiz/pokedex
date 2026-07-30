import {
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Sparkles,
  Stamp,
  Tags,
  Target,
  Trophy,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { requireAuth } from "@/lib/require-auth"
import {
  getPassportForSession,
  type ParticipantPassport,
  type PassportAchievement,
} from "@/modules/passport/passport.service"
import {
  type PassportCollection,
  PassportTabs,
} from "@/modules/passport/passport-tabs"
import { hasPermission } from "@/modules/profile/profile.authorization"
import { requireProfileForSession } from "@/modules/profile/profile.service"

export const metadata: Metadata = { title: "Passaporte" }
export const dynamic = "force-dynamic"

type PassportPageProps = Readonly<{
  searchParams: Promise<{ collection?: string }>
}>

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export default async function PassportPage({
  searchParams,
}: PassportPageProps) {
  const [session, params] = await Promise.all([requireAuth(), searchParams])
  const profile = await requireProfileForSession(session)

  if (hasPermission(profile, "serve-participants")) {
    redirect("/operations")
  }

  const passport = await getPassportForSession(session)
  const initialCollection: PassportCollection =
    params.collection === "tags" || params.collection === "missions"
      ? params.collection
      : "companies"

  if (!passport.available) {
    return (
      <EmptyPassport
        title="Passaporte de participante"
        description="Esta área acompanha somente as atividades realizadas por participantes."
      />
    )
  }

  if (passport.totalCount === 0) {
    return (
      <EmptyPassport
        title="Sua jornada começará em breve"
        description="As empresas, Tags e missões aparecerão aqui quando as atividades forem liberadas."
      />
    )
  }

  const progress = (passport.completedCount / passport.totalCount) * 100

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Seu passaporte</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Reúna carimbos, encontre Tags e conclua missões.
        </p>
      </section>

      <PassportOverview passport={passport} progress={progress} />

      <ProgressSummary passport={passport} />

      {passport.recentAchievements.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Últimas conquistas</h2>
          <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
            {passport.recentAchievements.map((achievement) => (
              <AchievementRow key={achievement.key} achievement={achievement} />
            ))}
          </div>
        </section>
      )}

      <PassportCollections
        passport={passport}
        initialCollection={initialCollection}
      />
    </div>
  )
}

function PassportOverview({
  passport,
  progress,
}: Readonly<{ passport: ParticipantPassport; progress: number }>) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-(image:--gradient-primary-card) p-5 text-primary-foreground shadow-glow-primary">
      <Stamp
        className="absolute -right-6 -bottom-8 size-40 rotate-[-12deg] text-primary-foreground/12"
        strokeWidth={1.25}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary-foreground/75">
              Progresso geral
            </p>
            <p className="mt-1 font-pixel-square text-5xl font-bold tabular-nums">
              {Math.round(progress)}%
            </p>
            <p className="mt-1 text-xs text-primary-foreground/70">
              {passport.completedCount} de {passport.totalCount} atividades
            </p>
          </div>
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Trophy className="size-6 text-secondary" aria-hidden="true" />
          </span>
        </div>

        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-primary-foreground/20"
          role="progressbar"
          aria-label="Progresso geral do passaporte"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full rounded-full bg-success transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-semibold">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {passport.xpEarned.toLocaleString("pt-BR")} XP conquistados
        </p>
      </div>
    </section>
  )
}

function EmptyPassport({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="rounded-full bg-primary/10 p-4 text-primary">
        <BookOpen className="size-8" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  )
}

function ProgressSummary({
  passport,
}: Readonly<{ passport: ParticipantPassport }>) {
  const summaries = [
    {
      value: "companies" as const,
      label: "Empresas",
      icon: Building2,
      completed: passport.companies.completedCount,
      total: passport.companies.totalCount,
    },
    {
      value: "tags" as const,
      label: "Tags",
      icon: Tags,
      completed: passport.tags.discoveredCount,
      total: passport.tags.totalCount,
    },
    {
      value: "missions" as const,
      label: "Missões",
      icon: Target,
      completed: passport.missions.completedCount,
      total: passport.missions.totalCount,
    },
  ]

  return (
    <section className="grid grid-cols-3 gap-2" aria-label="Resumo da jornada">
      {summaries.map(({ value, label, icon: Icon, completed, total }) => (
        <Link
          key={value}
          href={`/passport?collection=${value}#passport-collections`}
          className="flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-card px-2 py-3 text-center ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={`Ver coleção de ${label}: ${completed} de ${total}`}
        >
          <Icon className="size-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold tabular-nums">
              {completed}/{total}
            </p>
            <p className="truncate text-xs text-muted-foreground">{label}</p>
          </div>
        </Link>
      ))}
    </section>
  )
}

function AchievementRow({
  achievement,
}: Readonly<{ achievement: PassportAchievement }>) {
  const fallback = {
    company: <Building2 aria-hidden="true" />,
    tag: <Tags aria-hidden="true" />,
    mission: <Target aria-hidden="true" />,
  }[achievement.type]

  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3">
      <Avatar className="size-11 rounded-lg">
        {achievement.imageUrl && (
          <AvatarImage
            src={achievement.imageUrl}
            alt=""
            className="rounded-lg object-contain"
          />
        )}
        <AvatarFallback className="rounded-lg">{fallback}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{achievement.label}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3" aria-hidden="true" />
          {dateFormatter.format(achievement.completedAt)}
        </p>
      </div>
      <span className="text-xs font-medium text-primary">
        +{achievement.xpAwarded} XP
      </span>
    </div>
  )
}

function PassportCollections({
  passport,
  initialCollection,
}: Readonly<{
  passport: ParticipantPassport
  initialCollection: PassportCollection
}>) {
  return (
    <section id="passport-collections" className="scroll-mt-4 space-y-3">
      <h2 className="text-lg font-semibold">Coleções</h2>
      <PassportTabs initialValue={initialCollection}>
        <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl">
          <TabsTrigger value="companies">
            Empresas
            <span className="text-[10px] opacity-65">
              {passport.companies.completedCount}/
              {passport.companies.totalCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tags">
            Tags
            <span className="text-[10px] opacity-65">
              {passport.tags.discoveredCount}/{passport.tags.totalCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="missions">
            Missões
            <span className="text-[10px] opacity-65">
              {passport.missions.completedCount}/{passport.missions.totalCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="pt-3">
          <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
            {passport.companies.items.length === 0 && (
              <CollectionEmpty message="Nenhuma empresa disponível." />
            )}
            {passport.companies.items.map((company) => {
              const visited = company.visitedAt !== null

              return (
                <Link
                  key={company.id}
                  href={`/companies/${encodeURIComponent(company.id)}`}
                  className={
                    visited
                      ? "flex min-h-18 items-center gap-3 bg-primary/5 px-4 py-3 focus-visible:bg-muted focus-visible:outline-none"
                      : "flex min-h-18 items-center gap-3 px-4 py-3 opacity-70 focus-visible:bg-muted focus-visible:outline-none"
                  }
                >
                  <Avatar
                    className={`size-11 shrink-0 rounded-xl ${visited ? "" : "grayscale"}`}
                  >
                    <AvatarImage
                      src={visited ? company.stampImageUrl : company.logoUrl}
                      alt=""
                      className="rounded-xl object-contain"
                    />
                    <AvatarFallback className="rounded-xl">
                      <Building2 aria-hidden="true" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {company.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {visited ? "Estande visitado" : "Ainda não visitada"}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-medium text-primary">
                      +{company.xpAwarded} XP
                    </span>
                    {visited && (
                      <Stamp
                        className="mt-1 ml-auto size-4 text-success"
                        aria-label="Carimbo conquistado"
                      />
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="tags" className="pt-3">
          <div className="grid grid-cols-2 gap-3">
            {passport.tags.items.length === 0 && (
              <CollectionEmpty message="Nenhuma Tag disponível." />
            )}
            {passport.tags.items.map((tag) =>
              tag.status === "discovered" ? (
                <div
                  key={tag.slot}
                  className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl bg-card p-4 text-center ring-1 ring-foreground/10"
                >
                  <Avatar className="size-20 rounded-xl">
                    <AvatarImage
                      src={tag.imageUrl}
                      alt=""
                      className="rounded-xl object-contain"
                    />
                    <AvatarFallback className="rounded-xl">TAG</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="line-clamp-2 text-sm font-medium">
                      {tag.name}
                    </p>
                    <p className="mt-1 text-xs text-primary">
                      +{tag.xpAwarded} XP
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  key={tag.slot}
                  className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/40 p-4 text-center"
                >
                  <LockKeyhole
                    className="size-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted-foreground">
                    Tag não encontrada
                  </p>
                </div>
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="missions" className="pt-3">
          <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
            {passport.missions.items.length === 0 && (
              <CollectionEmpty message="Nenhuma missão disponível." />
            )}
            {passport.missions.items.map((mission) => (
              <div
                key={mission.id}
                className="flex min-h-16 items-center gap-3 px-4 py-3"
              >
                {mission.status === "completed" ? (
                  <CheckCircle2
                    className="size-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <Target
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {mission.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mission.status === "completed"
                      ? "Missão concluída"
                      : "Missão pendente"}
                  </p>
                </div>
                <span className="text-xs font-medium text-primary">
                  +{mission.xpAwarded} XP
                </span>
              </div>
            ))}
          </div>
        </TabsContent>
      </PassportTabs>
    </section>
  )
}

function CollectionEmpty({ message }: Readonly<{ message: string }>) {
  return (
    <p className="col-span-2 rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  )
}
