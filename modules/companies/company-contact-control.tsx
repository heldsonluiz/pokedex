"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

import { setCompanyContactConsentAction } from "./company.actions"

export function CompanyContactControl({
  companyId,
  companyName,
  granted,
}: {
  companyId: string
  companyName: string
  granted: boolean
}) {
  const [allowed, setAllowed] = useState(granted)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState("")
  return (
    <section className="space-y-3 rounded-2xl border p-4">
      <h2 className="font-semibold">Contato com {companyName}</h2>
      <p className="text-sm text-muted-foreground">
        Você pode autorizar o compartilhamento do seu nome, e-mail e LinkedIn
        com esta empresa para contato após o evento. A escolha é opcional e
        independente da visita e do XP. Você pode revogar aqui; contatos já
        exportados não são recolhidos automaticamente.
      </p>
      <p className="text-sm">
        {allowed
          ? "Compartilhamento autorizado."
          : "Seu contato não está autorizado para esta empresa."}
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setCompanyContactConsentAction({
              companyId,
              granted: !allowed,
            })
            if (result.success) {
              setAllowed(!allowed)
              setMessage("Preferência salva.")
            } else setMessage("Não foi possível salvar. Tente novamente.")
          })
        }
      >
        {pending
          ? "Salvando…"
          : allowed
            ? "Revogar compartilhamento"
            : "Autorizar compartilhamento"}
      </Button>
      <p role="status" className="text-sm">
        {message}
      </p>
    </section>
  )
}
