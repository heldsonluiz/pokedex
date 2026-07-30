import { UserRoundSearch } from "lucide-react"
import type { Metadata } from "next"

import { requireAuth } from "@/lib/require-auth"
import { listConnectionsForSession } from "@/modules/networking/connection.service"
import { ConnectionCard } from "@/modules/networking/connection-card"

export const metadata: Metadata = {
  title: "Conexões",
}

export const dynamic = "force-dynamic"

export default async function ConnectionsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ result?: string | string[] }>
}>) {
  const [session, query] = await Promise.all([requireAuth(), searchParams])
  const connections = await listConnectionsForSession(session)
  const result = typeof query.result === "string" ? query.result : null
  if (connections.length === 0) {
    return (
      <div className="flex min-h-full flex-col gap-6 p-6">
        <ScanResultFeedback result={result} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className="rounded-full bg-primary/10 p-4 text-primary">
            <UserRoundSearch className="size-8" aria-hidden="true" />
          </span>
          <div className="max-w-sm space-y-2">
            <h2 className="text-xl font-semibold">Nenhuma conexão ainda</h2>
            <p className="text-sm text-muted-foreground">
              Leia o QR Code de outro participante para criar sua primeira
              conexão.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <ScanResultFeedback result={result} />
      <ConnectionSection title="Minhas conexões" items={connections} />
    </div>
  )
}

function ScanResultFeedback({ result }: Readonly<{ result: string | null }>) {
  if (!result) {
    return null
  }

  const messages: Record<string, string> = {
    ALREADY_CONNECTED: "Vocês já estavam conectados.",
    CONNECTION_CREATED: "Conexão criada. Vocês receberam 5 XP.",
    INVALID_EVENT: "Este QR Code pertence a outro evento.",
    INVALID_QR: "Não foi possível validar este QR Code.",
    PROFILE_NOT_FOUND: "O perfil deste participante não está disponível.",
    QR_EXPIRED: "Este QR Code expirou. Peça um código atualizado.",
    SCAN_COOLDOWN: "Aguarde um minuto antes de tentar novamente.",
    SELF_CONNECTION: "Você não pode se conectar com o próprio perfil.",
  }
  const isSuccess =
    result === "CONNECTION_CREATED" || result === "ALREADY_CONNECTED"

  return (
    <p
      className={
        isSuccess
          ? "rounded-xl bg-success/10 p-4 text-sm text-success"
          : "rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
      }
      role={isSuccess ? "status" : "alert"}
    >
      {messages[result] ?? "Não foi possível processar o QR Code."}
    </p>
  )
}

function ConnectionSection({
  title,
  items,
}: Readonly<{
  title: string
  items: Awaited<ReturnType<typeof listConnectionsForSession>>
}>) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-3">
        {items.map((connection) => (
          <ConnectionCard key={connection.id} connection={connection} />
        ))}
      </div>
    </section>
  )
}
