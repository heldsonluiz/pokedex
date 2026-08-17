"use client"

import { Building2, CheckCircle2, ScanLine } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactElement, ReactNode } from "react"

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

import type { CompanyDetails } from "./company.service"

export function CompanyDetailsDialog({
  company,
  trigger,
  children,
}: Readonly<{
  company: CompanyDetails
  trigger: ReactElement
  children: ReactNode
}>) {
  return (
    <Dialog>
      <DialogTrigger render={trigger}>{children}</DialogTrigger>
      <CompanyDialogContent company={company} />
    </Dialog>
  )
}

export function CompanyDetailsModal({
  company,
}: Readonly<{ company: CompanyDetails }>) {
  const router = useRouter()

  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <CompanyDialogContent company={company} />
    </Dialog>
  )
}

function CompanyDialogContent({
  company,
}: Readonly<{ company: CompanyDetails }>) {
  const visited = company.visitedAt !== null

  return (
    <DialogContent>
      <DialogHeader className="px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar className="size-28 rounded-xl bg-white">
            <AvatarImage
              src={company.logoUrl}
              alt={`Logo da ${company.name}`}
              className="rounded-xl object-contain"
            />
            <AvatarFallback className="rounded-xl">
              <Building2 aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Badge variant={visited ? "default" : "outline"}>
              {visited ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <Building2 aria-hidden="true" />
              )}
              {visited ? "Visitada" : "Disponível"}
            </Badge>
            <DialogTitle className="mt-2 text-lg leading-snug">
              {company.name}
            </DialogTitle>
          </div>
        </div>
        <DialogDescription className="pt-2 leading-6 whitespace-pre-wrap">
          {company.description ||
            "Esta empresa não possui uma descrição cadastrada."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-muted p-3">
          <span className="text-sm text-muted-foreground">Recompensa</span>
          <span className="font-semibold text-primary">
            +{company.xpAwarded} XP
          </span>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <p className="text-sm font-medium">
            {visited ? "Carimbo conquistado" : "Como concluir"}
          </p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {company.visitedAt
              ? `Visitada em ${new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(company.visitedAt)}.`
              : "Encontre e leia o QR Code desta empresa no estande durante o evento."}
          </p>
        </div>
      </div>

      <DialogFooter className="flex-row">
        <DialogClose render={<Button variant="outline" className="flex-1" />}>
          Fechar
        </DialogClose>
        {!visited && (
          <Button
            className="flex-1"
            render={<Link href="/scan" />}
            nativeButton={false}
          >
            <ScanLine aria-hidden="true" />
            Abrir scanner
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  )
}
