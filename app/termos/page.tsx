import type { Metadata } from "next"
import Link from "next/link"

import { LegalLinks } from "@/components/layout/legal-links"
export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "Termos de uso da Pokédex do DevFest Triângulo: dados, participação e contato com a organização.",
  alternates: { canonical: "/termos" },
  robots: { index: true, follow: true },
}
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link className="underline" href="/login">
        Voltar para a Pokédex
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Termos de uso</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Atualizado em 17 de novembro de 2026.
      </p>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Finalidade</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Os serviços apoiam a divulgação e a participação no DevFest Triângulo.
          Informações de programação, palestrantes, empresas e atividades podem
          ser atualizadas. Consulte os canais oficiais para esclarecer
          alterações.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Conduta e direitos</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Use os serviços de forma lícita e respeitosa, sem comprometer a
          segurança da plataforma ou expor dados de outras pessoas. Respeite o
          código de conduta do evento e os direitos sobre marcas, imagens e
          conteúdos apresentados.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          Serviços externos e disponibilidade
        </h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Links externos possuem regras próprias. Os serviços podem passar por
          manutenção ou interrupções. Estes termos não afastam direitos
          assegurados pela legislação aplicável.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Contato</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Dúvidas sobre estes termos podem ser enviadas para
          gdg.uberlandia@gmail.com.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Participação e recompensas</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Use sua própria conta e informe dados corretos. Pontos, níveis,
          missões, tickets, sorteios e recompensas seguem as regras e a
          disponibilidade definidas pela organização. Não manipule QR Codes nem
          tente registrar atividades indevidas. O encerramento do evento pode
          impedir novas atividades e preservar o histórico.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Permissões e privacidade</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          A permissão de câmera atende ao scanner; notificações e contato por
          empresas possuem escolhas próprias. Consulte a política de privacidade
          para conhecer o uso dos dados. A participação não autoriza
          automaticamente o contato comercial por todas as empresas.
        </p>
      </section>
      <LegalLinks />
    </main>
  )
}
