import { Building2, CheckCircle2, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/require-auth"
import {
  type CompanyListItem,
  listCompaniesForSession,
} from "@/modules/companies/company.service"

export const metadata: Metadata = {
  title: "Empresas",
}

export const dynamic = "force-dynamic"

export default async function CompaniesPage() {
  const session = await requireAuth()
  const companies = await listCompaniesForSession(session)

  if (companies.length === 0) {
    return (
      <section className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="rounded-full bg-primary/10 p-4 text-primary">
          <Building2 className="size-8" aria-hidden="true" />
        </span>
        <div className="max-w-sm space-y-2">
          <h1 className="text-xl font-semibold">Nenhuma empresa disponível</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            As empresas participantes aparecerão aqui quando estiverem ativas.
          </p>
        </div>
      </section>
    )
  }

  const visitedCount = companies.filter(
    (company) => company.visitedAt !== null
  ).length

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Explore os estandes
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Visite as empresas, leia seus QR Codes e complete seu passaporte.
        </p>
        <p className="text-sm font-medium text-primary">
          {visitedCount} de {companies.length} empresas visitadas
        </p>
      </section>

      <section className="space-y-3" aria-label="Empresas participantes">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </section>
    </div>
  )
}

function CompanyCard({ company }: Readonly<{ company: CompanyListItem }>) {
  const visited = company.visitedAt !== null

  return (
    <Link
      href={`/companies/${encodeURIComponent(company.id)}`}
      className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Avatar className="size-16 rounded-xl">
        <AvatarImage
          src={company.logoUrl}
          alt={`Logo da ${company.name}`}
          className="rounded-xl object-contain"
        />
        <AvatarFallback className="rounded-xl">
          <Building2 aria-hidden="true" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{company.name}</h2>
          {visited && (
            <Badge variant="secondary">
              <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
              Visitada
            </Badge>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {company.description ??
            `Visite o estande e ganhe ${company.xpAwarded} XP.`}
        </p>
      </div>

      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </Link>
  )
}
