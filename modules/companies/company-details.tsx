import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ScanLine,
  Sparkles,
  Stamp,
} from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { CompanyDetails as CompanyDetailsData } from "./company.service"

export function CompanyDetails({
  company,
}: Readonly<{ company: CompanyDetailsData }>) {
  const visitedAt = company.visitedAt

  return (
    <div className="space-y-6 p-6">
      <section className="flex items-center gap-4 rounded-3xl bg-(image:--gradient-immersive) p-5 text-white shadow-card">
        <Avatar className="size-20 shrink-0 rounded-2xl bg-white ring-2 ring-white/15">
          <AvatarImage
            src={company.logoUrl}
            alt={`Logo da ${company.name}`}
            className="rounded-3xl object-contain"
          />
          <AvatarFallback className="rounded-2xl">
            <Building2 className="size-8" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium text-white/65">
            Estande participante
          </p>
          <h1 className="text-xl font-bold tracking-tight">{company.name}</h1>
          {visitedAt && (
            <Badge className="bg-success text-white">
              <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
              Empresa visitada
            </Badge>
          )}
        </div>
      </section>

      {company.description && (
        <Card className="rounded-2xl">
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

      <Card
        className={
          visitedAt ? "rounded-3xl bg-success/5 ring-success/25" : "rounded-3xl"
        }
      >
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
              <Link
                href="/scan"
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              >
                <ScanLine data-icon="inline-start" aria-hidden="true" />
                Abrir scanner
                <ChevronRight data-icon="inline-end" aria-hidden="true" />
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
