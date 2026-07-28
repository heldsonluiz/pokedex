import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { AppShell } from "@/components/layout/app-shell"
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
    <AppShell
      header={<AppHeader title="Meu QR Code" showBack />}
      contentClassName="bg-background"
      theme="dark"
    >
      <div className="space-y-6 px-6 py-8">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">Compartilhe seu perfil</h2>
          <p className="text-sm text-muted-foreground">
            Peça para outro participante escanear este código para iniciar uma
            conexão.
          </p>
        </div>

        <UserQrCodeCard initialQrCode={initialQrCode} />

        <p className="text-center text-xs text-muted-foreground">
          Abrir o código não cria uma conexão automaticamente. A ação será
          confirmada pelo participante que fizer a leitura.
        </p>
      </div>
    </AppShell>
  )
}
