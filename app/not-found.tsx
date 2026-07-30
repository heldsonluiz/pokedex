import { NotFoundState } from "@/components/layout/not-found-state"

export default function GlobalNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1">
      <NotFoundState
        className="w-full"
        title="Página não encontrada"
        description="O endereço acessado não existe ou não está mais disponível."
        href="/login"
        actionLabel="Ir para o acesso"
      />
    </main>
  )
}
