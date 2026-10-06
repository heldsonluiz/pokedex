import { TICKET_EXCHANGE_RATE_XP } from "@/config/tickets"

export function ProfileHelp() {
  const questions = [
    [
      "Como ganho XP?",
      "Faça conexões, visite empresas, descubra tags, conclua missões e avalie palestras. Confira os requisitos de cada atividade; repetir uma leitura já registrada não duplica o XP.",
    ],
    [
      "Como funcionam os tickets?",
      "Converta o XP disponível em tickets na página Tickets. Você pode gastá-los na lojinha, onde cada brinde tem um preço específico, ou guardá-los para os sorteios finais. Quanto mais tickets disponíveis no momento do sorteio, maiores são suas chances de ganhar. Tickets gastos não são reembolsáveis, e a conversão não pode ser desfeita; confirme sua escolha antes de converter ou resgatar.",
    ],
    [
      "Converter XP reduz meus pontos?",
      `Não. Cada ${TICKET_EXCHANGE_RATE_XP} XP ainda não convertidos rende um ticket. Seu XP, nível e ranking são preservados. A conversão fica disponível enquanto estiver liberada pela organização.`,
    ],
    [
      "Como participo do sorteio?",
      "Concluir seu perfil concede um ticket inicial. Acesse Tickets para converter mais XP e acompanhar seu saldo. Tickets usados em brindes deixam de participar do sorteio; ganhar não é garantido e vencedores não participam dos sorteios seguintes.",
    ],
    [
      "Por que não consigo avaliar uma palestra?",
      "A organização precisa liberar a avaliação. O horário de término, sozinho, não a libera. Cada participante pode avaliar uma palestra uma única vez.",
    ],
    [
      "Meu QR Code ou scanner não funciona. E agora?",
      "As leituras precisam de internet. Se o QR do participante expirou, peça para a pessoa abrir Meu QR Code novamente. Se a câmera foi bloqueada, permita o acesso nas configurações do navegador e tente outra vez.",
    ],
  ]

  return (
    <section className="space-y-3" aria-labelledby="profile-help-title">
      <h2 id="profile-help-title" className="text-lg font-semibold">
        Ajuda rápida
      </h2>
      <div className="divide-y divide-border rounded-2xl bg-card px-4 ring-1 ring-foreground/10">
        {questions.map(([question, answer]) => (
          <details key={question} className="py-1">
            <summary className="cursor-pointer rounded-lg py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
              {question}
            </summary>
            <p className="pb-3 text-sm leading-6 text-muted-foreground">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
