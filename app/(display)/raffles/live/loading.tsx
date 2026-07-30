import { Dices, LoaderCircle } from "lucide-react"

export default function RaffleLiveLoading() {
  return (
    <main
      className="dark relative flex h-dvh items-center justify-center overflow-hidden bg-[#05020d] px-8 text-center text-foreground"
      aria-busy="true"
      aria-label="Carregando telão do sorteio"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 50% 15%, rgb(124 58 237 / 45%), transparent 42%), radial-gradient(circle at 85% 85%, rgb(246 241 24 / 12%), transparent 32%)",
        }}
      />
      <div className="relative flex flex-col items-center">
        <span className="flex size-20 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-glow-primary">
          <LoaderCircle className="size-10 animate-spin" aria-hidden="true" />
        </span>
        <div className="mt-6 flex items-center gap-2 text-secondary">
          <Dices className="size-5" aria-hidden="true" />
          <p className="font-pixel-square text-lg tracking-widest uppercase">
            Preparando o telão
          </p>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Carregando o estado mais recente do sorteio...
        </p>
      </div>
    </main>
  )
}
