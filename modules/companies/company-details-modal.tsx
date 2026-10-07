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
    <Dialog
      historyMode="route"
      open
      onOpenChange={(open) => !open && router.back()}
    >
      <CompanyDialogContent company={company} />
    </Dialog>
  )
}

function CompanyDialogContent({
  company,
}: Readonly<{ company: CompanyDetails }>) {
  const visited = company.visitedAt !== null

  return (
    <DialogContent
      className="block overflow-hidden rounded-3xl bg-[#070b18] p-0 text-white ring-white/10 sm:max-w-sm"
      showCloseButton={false}
    >
      <div className="flex min-h-64 items-center justify-center bg-[#070b18] p-8">
        <Avatar className="size-40 rounded-2xl bg-transparent">
          <AvatarImage
            src={company.logoUrl}
            alt={`Logo da ${company.name}`}
            className="rounded-2xl object-contain"
          />
          <AvatarFallback className="rounded-2xl bg-white/10 text-white">
            <Building2 className="size-12" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="relative -mt-5 space-y-4 rounded-t-[2rem] bg-[#0d1324] p-4 pt-6">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/20">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl leading-snug text-white">
                {company.name}
              </DialogTitle>
              <Badge
                className="mt-1.5 border-cyan-300/25 bg-cyan-400/15 text-cyan-200"
                variant={visited ? "default" : "outline"}
              >
                {visited ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <Building2 aria-hidden="true" />
                )}
                {visited ? "Visitada" : "Disponível"}
              </Badge>
            </div>
          </div>
          <DialogDescription className="pt-1 leading-6 whitespace-pre-wrap text-white/65">
            {company.description ||
              "Esta empresa não possui uma descrição cadastrada."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
          <div className="bg-white/5 p-4">
            <p className="text-xs font-medium text-white/50">Recompensa</p>
            <p className="mt-2 text-xl font-bold text-cyan-300">
              +{company.xpAwarded} XP
            </p>
          </div>
          <div className="bg-white/5 p-4">
            <p className="text-xs font-medium text-white">
              {visited ? "Carimbo conquistado" : "Como concluir"}
            </p>
            <p className="mt-2 text-sm leading-5 text-white/60">
              {company.visitedAt
                ? `Visitada em ${new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(company.visitedAt)}.`
                : "Visite o estande e escaneie o QR Code."}
            </p>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row rounded-none border-0 bg-transparent p-0 pt-2">
          <DialogClose
            render={
              <Button
                variant="outline"
                className="flex-1 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              />
            }
          >
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
      </div>
    </DialogContent>
  )
}
