import { QrCode, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"

import { requireAuth } from "@/lib/require-auth"
import { issueUserQrCode } from "@/modules/qr-code/user-qr-code.service"
import { UserQrCodeCard } from "@/modules/qr-code/user-qr-code-card"

export const metadata: Metadata = {
  title: "Meu QR Code",
}

export default async function ProfileQrCodePage() {
  const session = await requireAuth()
  const initialQrCode = await issueUserQrCode(session)

  return (
    <div className="space-y-6 p-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Meu QR Code</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Peça para outro participante escanear este código para iniciar uma
          conexão.
        </p>
      </section>

      <section className="overflow-hidden rounded-3xl bg-(image:--gradient-immersive) p-5 text-white shadow-card">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <QrCode className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold">Compartilhe seu perfil</h2>
            <p className="text-xs text-white/65">Conexão rápida e segura</p>
          </div>
        </div>
        <UserQrCodeCard initialQrCode={initialQrCode} />
      </section>

      <div className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-success"
          aria-hidden="true"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          A conexão e os 5 XP são registrados automaticamente quando outro
          participante lê este código.
        </p>
      </div>
    </div>
  )
}
