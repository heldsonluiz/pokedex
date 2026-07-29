import { Building2, CheckCircle2, Sparkles, Stamp } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAuth } from "@/lib/require-auth"
import { getCompanyDetailsForSession } from "@/modules/companies/company.service"

type CompanyDetailsPageProps = Readonly<{
  params: Promise<{
    companyId: string
  }>
}>

export const metadata: Metadata = {
  title: "Empresa",
}

export default async function CompanyDetailsPage({
  params,
}: CompanyDetailsPageProps) {
  const [{ companyId }, session] = await Promise.all([params, requireAuth()])
  const company = await getCompanyDetailsForSession(session, companyId)

  if (!company) {
    notFound()
  }

  const visitedAt = company.visitedAt

  return (
    <div className="space-y-6 p-6">
      <section className="flex flex-col items-center gap-4 text-center">
        <Avatar className="size-32 rounded-3xl">
          <AvatarImage
            src={company.logoUrl}
            alt={`Logo da ${company.name}`}
            className="rounded-3xl object-contain"
          />
          <AvatarFallback className="rounded-3xl">
            <Building2 className="size-10" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          {visitedAt && (
            <Badge variant="secondary">
              <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
              Empresa visitada
            </Badge>
          )}
        </div>
      </section>

      {company.description && (
        <Card>
          <CardHeader>
            <CardTitle>Sobre a empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
              {company.description}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {visitedAt ? "Carimbo conquistado" : "Visite o estande"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {visitedAt ? (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="size-20 rounded-2xl">
                  <AvatarImage
                    src={company.stampImageUrl}
                    alt={`Carimbo da ${company.name}`}
                    className="rounded-2xl object-contain"
                  />
                  <AvatarFallback className="rounded-2xl">
                    <Stamp aria-hidden="true" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Presente no passaporte</p>
                  <p className="text-sm text-muted-foreground">
                    Conquistado em{" "}
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(visitedAt)}
                  </p>
                </div>
              </div>

              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {company.xpAwarded} XP recebidos
              </p>
            </>
          ) : (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                Encontre o QR Code da empresa no estande para adicionar o
                carimbo ao seu passaporte.
              </p>
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                Vale {company.xpAwarded} XP
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
