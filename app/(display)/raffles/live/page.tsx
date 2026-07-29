import { CheckCircle2, Dices, FlaskConical, Trophy } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { requireAuth } from "@/lib/require-auth"
import { cn } from "@/lib/utils"
import { getRaffleOperationsForSession } from "@/modules/raffles/raffle.service"
import { RaffleLiveRefresh } from "@/modules/raffles/raffle-live-refresh"

export const metadata: Metadata = {
  title: "Sorteio ao vivo",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

export default async function RaffleLivePage() {
  const session = await requireAuth()
  const operations = await getRaffleOperationsForSession(session)

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

        <header className="relative flex items-center justify-between gap-6 px-[clamp(2rem,5vw,6rem)] py-[clamp(1.5rem,3vw,3rem)]">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-glow-primary">
              <Dices className="size-8 text-primary-foreground" aria-hidden />
            </span>
            <div>
              <p className="font-pixel-square text-sm tracking-[0.24em] text-secondary uppercase">
                DevFest
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                Sorteio ao vivo
              </h1>
            </div>
          </div>

          {simulation && (
            <div className="flex items-center gap-3 rounded-full border border-secondary/40 bg-secondary/10 px-5 py-3 text-secondary">
              <FlaskConical className="size-5" aria-hidden />
              <span className="font-semibold tracking-wide uppercase">
                Simulação
              </span>
            </div>
          )}
        </header>

        <main className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(34rem,42rem)] gap-[clamp(2rem,4vw,5rem)] px-[clamp(2rem,5vw,6rem)] pb-[clamp(2rem,5vw,5rem)]">
          <section className="flex min-h-0 items-center justify-center">
            <RaffleLiveRefresh>
              <div className="w-full max-w-5xl text-center">
                {closureStatus !== "closed" ? (
                  <>
                    <p className="font-pixel-square text-xl text-secondary">
                      Preparando o universo
                    </p>
                    <h2 className="mt-5 text-[clamp(3rem,7vw,7rem)] leading-none font-black tracking-tight">
                      O sorteio começa em breve
                    </h2>
                  </>
                ) : currentCandidate ? (
                  <>
                    <p className="font-pixel-square text-xl text-secondary">
                      Presença sendo confirmada
                    </p>
                    <h2 className="mt-6 bg-gradient-to-r from-white via-secondary to-white bg-clip-text text-[clamp(4rem,9vw,9rem)] leading-[0.95] font-black tracking-tight text-transparent">
                      {currentCandidate.currentCandidateName}
                    </h2>
                    <p className="mt-8 text-[clamp(1.25rem,2vw,2rem)] text-muted-foreground">
                      Candidato a {currentCandidate.prizeName}
                    </p>
                  </>
                ) : latestWinner ? (
                  <>
                    <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-success/15 text-success ring-1 ring-success/30">
                      <Trophy className="size-12" aria-hidden />
                    </div>
                    <p className="mt-7 font-pixel-square text-xl text-success">
                      Vencedor confirmado
                    </p>
                    <h2 className="mt-5 text-[clamp(4rem,9vw,9rem)] leading-[0.95] font-black tracking-tight">
                      {latestWinner.winnerName}
                    </h2>
                    <p className="mt-8 text-[clamp(1.25rem,2vw,2rem)] text-muted-foreground">
                      {latestWinner.prizeName}
                    </p>
                    {!allDrawn && pendingRaffle && (
                      <p className="mt-10 text-lg text-secondary">
                        Próximo prêmio: {pendingRaffle.prizeName}
                      </p>
                    )}
                  </>
                ) : pendingRaffle ? (
                  <>
                    <p className="font-pixel-square text-xl text-secondary">
                      Próximo prêmio
                    </p>
                    <h2 className="mt-6 text-[clamp(4rem,9vw,9rem)] leading-[0.95] font-black tracking-tight">
                      {pendingRaffle.prizeName}
                    </h2>
                    <p className="mt-8 text-2xl text-muted-foreground">
                      Aguardando o sorteio
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mx-auto size-24 text-success" />
                    <h2 className="mt-6 text-[clamp(3rem,7vw,7rem)] leading-none font-black">
                      Sorteios concluídos
                    </h2>
                  </>
                )}
              </div>
            </RaffleLiveRefresh>
          </section>

          <aside className="raffle-prizes-scroll max-h-full min-h-0 self-center overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
            <p className="font-pixel-square text-sm tracking-widest text-secondary uppercase">
              Prêmios
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {raffles.map((raffle) => (
                <div
                  key={raffle.id}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4",
                    raffle.status === "drawn"
                      ? "border-success/25 bg-success/10"
                      : raffle.status === "awaiting_confirmation"
                        ? "border-secondary/40 bg-secondary/10"
                        : "border-white/10 bg-black/15"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
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
                    <p className="font-semibold">{raffle.prizeName}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
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
