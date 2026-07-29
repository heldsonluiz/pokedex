import {
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  LockKeyhole,
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
    <div className="space-y-7 p-6">
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Sua jornada no evento
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Reúna carimbos, encontre Tags e conclua missões.
          </p>
        </div>

        <div className="rounded-2xl bg-(image:--gradient-primary-card) p-5 text-primary-foreground shadow-glow-primary">
          <div className="flex flex-wrap gap-3">
            <span className="text-sm font-medium">Progresso geral</span>
            <span className="ml-auto text-sm tabular-nums">
              {passport.completedCount} de {passport.totalCount}
            </span>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20"
              role="progressbar"
              aria-label="Progresso geral do passaporte"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="h-full rounded-full bg-secondary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-primary-foreground/70">
                XP registrado no passaporte
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {passport.xpEarned}
              </p>
            </div>
            <Trophy className="size-9 text-secondary" aria-hidden="true" />
          </div>
        </div>
      </section>

      <ProgressSummary passport={passport} />

      {passport.recentAchievements.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Últimas conquistas</h2>
          <div className="space-y-2">
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
    <section className="grid grid-cols-2 gap-2" aria-label="Resumo da jornada">
      {summaries.map(({ value, label, icon: Icon, completed, total }) => (
        <Link
          key={value}
          href={`/passport?collection=${value}#passport-collections`}
          className="flex min-w-0 flex-col items-center gap-2 rounded-xl bg-card p-3 text-center ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="missions">Missões</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="pt-3">
          <div className="grid grid-cols-2 gap-3">
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
                      ? "relative flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl bg-[linear-gradient(145deg,var(--card)_55%,color-mix(in_oklab,var(--primary)_12%,var(--card)))] p-4 text-center shadow-sm ring-2 shadow-primary/10 ring-primary/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      : "relative flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl bg-muted/40 p-4 text-center opacity-70 ring-1 ring-foreground/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  }
                >
                  {visited && (
                    <span
                      className="absolute top-2 right-2 z-10 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background"
                      aria-label="Empresa visitada, carimbo conquistado"
                    >
                      <Stamp className="size-5" aria-hidden="true" />
                    </span>
                  )}
                  <Avatar
                    className={`size-20 rounded-xl ${visited ? "" : "grayscale"}`}
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
                  <div>
                    <p className="line-clamp-2 text-sm font-medium">
                      {company.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {visited
                        ? `Visitada · +${company.xpAwarded} XP`
                        : "Ainda não visitada"}
                    </p>
                  </div>
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
          <div className="space-y-2">
            {passport.missions.items.length === 0 && (
              <CollectionEmpty message="Nenhuma missão disponível." />
            )}
            {passport.missions.items.map((mission) => (
              <div
                key={mission.id}
                className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
              >
                {mission.status === "completed" ? (
                  <CheckCircle2
                    className="size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <LockKeyhole
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
                      : "Ainda não concluída"}
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
