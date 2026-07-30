import { CheckCircle2, Dices, FlaskConical, Trophy } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { getRaffleLiveForSession } from "@/modules/raffles/raffle.service"
import { RaffleLiveRefresh } from "@/modules/raffles/raffle-live-refresh"

export const metadata: Metadata = {
  title: "Sorteio ao vivo",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

export default async function RaffleLivePage() {
  const session = await requireAuth()
  const operations = await getRaffleLiveForSession(session)

  if (!operations) {
    notFound()
  }

  const simulation = operations.simulation
  const raffles = simulation?.raffles ?? operations.raffles
  const closureStatus = simulation
    ? simulation.status === "preparing"
      ? "processing"
      : "closed"
    : operations.closure.status
  const currentCandidate = raffles.find(
    (raffle) => raffle.status === "awaiting_confirmation"
  )
  const pendingRaffle = raffles.find((raffle) => raffle.status === "pending")
  const latestWinner = raffles
    .filter(
      (raffle) =>
        raffle.status === "drawn" && raffle.drawnAt && raffle.winnerName
    )
    .sort(
      (first, second) =>
        (second.drawnAt?.getTime() ?? 0) - (first.drawnAt?.getTime() ?? 0)
    )[0]
  const allDrawn =
    raffles.length > 0 && raffles.every((raffle) => raffle.status === "drawn")

  return (
    <div className="dark h-dvh overflow-hidden bg-[#05020d] text-foreground">
      <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(circle at 50% 15%, rgb(124 58 237 / 45%), transparent 42%), radial-gradient(circle at 85% 85%, rgb(246 241 24 / 12%), transparent 32%)",
          }}
        />

        <header className="relative flex items-center justify-between gap-5 px-[clamp(1.5rem,4vw,5rem)] py-[clamp(1rem,2.2dvh,2rem)]">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary shadow-glow-primary">
              <Dices className="size-7 text-primary-foreground" aria-hidden />
            </span>
            <div>
              <p className="font-pixel-square text-xs tracking-[0.24em] text-secondary uppercase">
                DevFest
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                Sorteio ao vivo
              </h1>
            </div>
          </div>

          {simulation && (
            <div className="flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-2 text-secondary">
              <FlaskConical className="size-4" aria-hidden />
              <span className="text-sm font-semibold tracking-wide uppercase">
                Simulação
              </span>
            </div>
          )}
        </header>

        <main className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(24rem,34rem)] gap-[clamp(1.5rem,3vw,3.5rem)] px-[clamp(1.5rem,4vw,5rem)] pb-[clamp(1.5rem,3dvh,3rem)]">
          <section className="flex min-h-0 items-center justify-center">
            <RaffleLiveRefresh eventId={operations.eventId}>
              <div className="w-full max-w-5xl text-center">
                {closureStatus !== "closed" ? (
                  <>
                    <p className="font-pixel-square text-lg text-secondary">
                      Preparando o universo
                    </p>
                    <h2 className="mt-4 text-[clamp(2.5rem,8dvh,5rem)] leading-none font-black tracking-tight">
                      O sorteio começa em breve
                    </h2>
                  </>
                ) : currentCandidate ? (
                  <>
                    <p className="font-pixel-square text-lg text-secondary">
                      Presença sendo confirmada
                    </p>
                    <h2 className="mt-4 bg-gradient-to-r from-white via-secondary to-white bg-clip-text text-[clamp(3rem,10dvh,7rem)] leading-[0.95] font-black tracking-tight text-transparent">
                      {currentCandidate.currentCandidateName}
                    </h2>
                    <p className="mt-5 text-[clamp(1rem,2.5dvh,1.5rem)] text-muted-foreground">
                      Candidato a {currentCandidate.prizeName}
                    </p>
                  </>
                ) : latestWinner ? (
                  <>
                    <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success/15 text-success ring-1 ring-success/30">
                      <Trophy className="size-10" aria-hidden />
                    </div>
                    <p className="mt-5 font-pixel-square text-lg text-success">
                      Vencedor confirmado
                    </p>
                    <h2 className="mt-4 text-[clamp(3rem,10dvh,7rem)] leading-[0.95] font-black tracking-tight">
                      {latestWinner.winnerName}
                    </h2>
                    <p className="mt-5 text-[clamp(1rem,2.5dvh,1.5rem)] text-muted-foreground">
                      {latestWinner.prizeName}
                    </p>
                    {!allDrawn && pendingRaffle && (
                      <p className="mt-7 text-base text-secondary">
                        Próximo prêmio: {pendingRaffle.prizeName}
                      </p>
                    )}
                  </>
                ) : pendingRaffle ? (
                  <>
                    <p className="font-pixel-square text-lg text-secondary">
                      Próximo prêmio
                    </p>
                    <h2 className="mt-4 text-[clamp(3rem,10dvh,7rem)] leading-[0.95] font-black tracking-tight">
                      {pendingRaffle.prizeName}
                    </h2>
                    <p className="mt-5 text-xl text-muted-foreground">
                      Aguardando o sorteio
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mx-auto size-20 text-success" />
                    <h2 className="mt-4 text-[clamp(2.5rem,8dvh,5rem)] leading-none font-black">
                      Sorteios concluídos
                    </h2>
                  </>
                )}
              </div>
            </RaffleLiveRefresh>
          </section>

          <aside className="raffle-prizes-scroll max-h-full min-h-0 self-center overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
            <p className="font-pixel-square text-xs tracking-widest text-secondary uppercase">
              Prêmios
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {raffles.map((raffle) => (
                <div
                  key={raffle.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    raffle.status === "drawn"
                      ? "border-success/25 bg-success/10"
                      : raffle.status === "awaiting_confirmation"
                        ? "border-secondary/40 bg-secondary/10"
                        : "border-white/10 bg-black/15"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      raffle.status === "drawn"
                        ? "bg-success/15 text-success"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {raffle.status === "drawn" ? (
                      <CheckCircle2 aria-hidden />
                    ) : (
                      <Trophy aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{raffle.prizeName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {raffle.status === "drawn"
                        ? raffle.winnerName
                        : raffle.status === "awaiting_confirmation"
                          ? "Confirmando presença"
                          : "Aguardando"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
