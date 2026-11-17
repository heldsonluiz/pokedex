import type { Metadata } from "next"
import Link from "next/link"

import { LegalLinks } from "@/components/layout/legal-links"
export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Política de privacidade da Pokédex do DevFest Triângulo: dados, participação e contato com a organização.",
  alternates: { canonical: "/privacidade" },
  robots: { index: true, follow: true },
}
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link className="underline" href="/login">
        Voltar para a Pokédex
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Política de privacidade</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Atualizado em 17 de novembro de 2026.
      </p>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Responsável e contato</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          A organização do DevFest Triângulo pode ser contatada pelo e-mail
          gdg.uberlandia@gmail.com. Use esse canal para dúvidas, correções e
          solicitações sobre seus dados.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Serviços e segurança</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Usamos serviços de hospedagem e infraestrutura que podem processar
          registros técnicos, como endereço IP e horário de acesso. Adotamos
          controles de acesso para restringir dados administrativos. Não
          publique credenciais nem informações pessoais de terceiros nos canais
          públicos de suporte.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Retenção e solicitações</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Dados necessários à operação e ao histórico do evento podem ser
          mantidos após seu encerramento. Para consultar, corrigir ou solicitar
          a exclusão de dados, entre em contato com a organização. A análise
          considera a finalidade do tratamento e eventuais obrigações de
          conservação; não há prazo único declarado nesta página.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Conta e participação</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          O acesso usa sua conta Google. A aplicação utiliza identificação da
          conta, nome e e-mail e armazena o perfil informado, interesses,
          habilidades e atividades do evento no Firebase. Campos opcionais, como
          faixa etária, objetivo e momento profissional, ajudam nas estatísticas
          do evento. Missões, visitas, conexões, avaliações, tickets e resgates
          compõem o histórico de participação.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          Visibilidade e contato com empresas
        </h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Informações do perfil podem aparecer em funcionalidades de networking
          e ranking conforme o funcionamento da plataforma. O compartilhamento
          de nome, e-mail e LinkedIn para contato por uma empresa depende da
          autorização específica disponível na página dela. Essa escolha é
          independente de visita e XP. Você pode revogá-la ali; cópias já
          exportadas não são recolhidas automaticamente.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Armazenamento e permissões</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Cookies de sessão e recursos locais necessários mantêm o acesso e as
          preferências da aplicação. A câmera só é utilizada pelo scanner
          mediante permissão do navegador. Notificações dependem de sua
          autorização e podem ser desativadas no navegador. Não adicionamos
          cookies opcionais de medição nesta alteração.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          Relatórios e serviços externos
        </h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          A organização acessa dados para operar o evento e elaborar relatórios.
          Dados de credenciamento podem complementar análises administrativas
          por correspondência de e-mail. Login Google e links externos seguem
          também as políticas dos respectivos serviços.
        </p>
      </section>
      <LegalLinks />
    </main>
  )
}
