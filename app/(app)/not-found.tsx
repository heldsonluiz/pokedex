import { NotFoundState } from "@/components/layout/not-found-state"

export default function AppNotFound() {
  return (
    <NotFoundState
      title="Conteúdo não encontrado"
      description="Este conteúdo não existe, foi removido ou não está disponível para sua conta."
      href="/home"
      actionLabel="Voltar ao início"
    />
  )
}
