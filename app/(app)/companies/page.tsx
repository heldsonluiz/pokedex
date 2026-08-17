import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Stamp,
} from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/layout/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { requireAuth } from "@/lib/require-auth"
import {
  type CompanyListItem,
  listCompaniesForSession,
} from "@/modules/companies/company.service"
import { CompanyDetailsDialog } from "@/modules/companies/company-details-modal"

export const metadata: Metadata = {
  title: "Empresas",
}

export const dynamic = "force-dynamic"

export default async function CompaniesPage() {
  const session = await requireAuth()
  const companies = await listCompaniesForSession(session)

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="size-8" aria-hidden="true" />}
        title="Nenhuma empresa disponível"
        description="As empresas participantes aparecerão aqui quando estiverem ativas."
      />
    )
  }

  const visitedCount = companies.filter(
    (company) => company.visitedAt !== null
  ).length
  const orderedCompanies = [...companies].sort(
    (first, second) =>
      Number(first.visitedAt !== null) - Number(second.visitedAt !== null)
  )
  const nextCompany = orderedCompanies.find(
    (company) => company.visitedAt === null
  )
  const progress = Math.round((visitedCount / companies.length) * 100)

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Explore os estandes
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Visite as empresas, leia seus QR Codes e complete seu passaporte.
        </p>
      </section>

      <section className="space-y-2" aria-label="Progresso nos estandes">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium">Seu progresso</p>
          <p className="text-muted-foreground tabular-nums">
            {visitedCount} de {companies.length} visitadas
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Empresas visitadas"
          aria-valuemin={0}
          aria-valuemax={companies.length}
          aria-valuenow={visitedCount}
        >
          <div
            className="h-full rounded-full bg-success transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="company-highlight-title">
        <h2
          id="company-highlight-title"
          className="text-sm font-semibold text-muted-foreground"
        >
          {nextCompany ? "Próximo estande" : "Passaporte completo"}
        </h2>
        {nextCompany ? (
          <FeaturedCompany company={nextCompany} />
        ) : (
          <div className="flex items-center gap-4 rounded-3xl bg-(image:--gradient-primary-card) p-5 text-primary-foreground shadow-glow-primary">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <Stamp className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold">Todos os carimbos conquistados</h3>
              <p className="mt-1 text-sm text-primary-foreground/75">
                Você visitou todos os estandes disponíveis.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="all-companies-title">
        <h2 id="all-companies-title" className="text-lg font-semibold">
          Todos os estandes
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          {orderedCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>
    </div>
  )
}

function FeaturedCompany({ company }: Readonly<{ company: CompanyListItem }>) {
  return (
    <CompanyDetailsDialog
      company={company}
      trigger={
        <button
          type="button"
          className="group block w-full rounded-3xl bg-(image:--gradient-immersive) p-5 text-left text-white shadow-card transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]"
        />
      }
    >
      <div className="flex items-start gap-4">
        <CompanyLogo company={company} featured />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/65">Visite agora</p>
          <h3 className="mt-1 text-lg font-semibold">{company.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/70">
            {company.description ?? "Conheça o estande e complete a visita."}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/25 px-2.5 py-1 text-xs font-semibold">
              <Sparkles className="size-3.5" aria-hidden="true" />+
              {company.xpAwarded} XP
            </span>
            <ChevronRight className="size-5 text-white/70" aria-hidden="true" />
          </div>
        </div>
      </div>
    </CompanyDetailsDialog>
  )
}

function CompanyCard({ company }: Readonly<{ company: CompanyListItem }>) {
  const visited = company.visitedAt !== null

  return (
    <CompanyDetailsDialog
      company={company}
      trigger={
        <button
          type="button"
          className={`flex min-h-18 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none ${
            visited ? "bg-success/5" : ""
          }`}
        />
      }
    >
      <CompanyLogo company={company} />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold">{company.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {visited
            ? "Estande visitado"
            : `Visite e ganhe ${company.xpAwarded} XP`}
        </p>
      </div>

      <span className="shrink-0 text-right">
        <span className="block text-xs font-semibold text-primary">
          +{company.xpAwarded} XP
        </span>
        <span className="mt-1 flex justify-end">
          {visited ? (
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          ) : (
            <ChevronRight
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </span>
      </span>
    </CompanyDetailsDialog>
  )
}

function CompanyLogo({
  company,
  featured = false,
}: Readonly<{ company: CompanyListItem; featured?: boolean }>) {
  return (
    <Avatar
      className={`${featured ? "size-16" : "size-11"} shrink-0 rounded-xl bg-white`}
    >
      <AvatarImage
        src={company.logoUrl}
        alt={`Logo da ${company.name}`}
        className="rounded-xl object-contain"
      />
      <AvatarFallback className="rounded-xl">
        <Building2 aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )
}
