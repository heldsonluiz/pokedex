# Roadmap

O desenvolvimento é incremental. Cada fase deve entregar uma parte utilizável, manter o projeto validável e atualizar a documentação afetada.

Status atual: Fases 1 (Fundação), 2 (Design System), 3 (Autenticação), 4 (Perfil), 5 (Onboarding), 6 (Navegação), 7 (Home), 8 (QR Code), 9 (Scanner), 10 (Networking), 11 (Empresas), 12 (Tags), 13 (Missões), 14 (Passaporte), 15 (Ranking), 17 (Tickets), 18 (Palestras), 22 (Escalabilidade do ranking) e 23 (Resumo individual leve) concluídas. A funcionalidade da Fase 16 (Badges) foi removida do produto. A Fase 19 (Polimento) permanece em andamento. O networking cria a conexão automaticamente após uma leitura válida, concede 5 XP a cada participante e permite que qualquer uma das partes remova a conexão, revogando a pontuação de ambas. Empresas ativas possuem um QR Code fixo; a primeira leitura registra permanentemente visita, carimbo e XP em uma transação idempotente. O catálogo e os detalhes exibem o progresso real do participante. Tags ativas usam QR Codes fixos e concedem XP uma única vez; a coleção mantém itens ainda não encontrados anônimos e revela seus dados após a descoberta permanente. Os valores padrão de XP ficam centralizados em `config/scores.ts`, e cada conclusão preserva o valor efetivamente concedido. O contrato central aceita QR Codes de participante, empresa, missão e tag; palestras não possuem QR Code e têm avaliações liberadas manualmente por administradores. Palestrantes, palestras e faixas do cronograma possuem contratos separados; uma página completa de cronograma permanece como melhoria futura. Cada avaliação exige três notas de 1 a 5 e comentário de 20 a 500 caracteres; sua conclusão idempotente concede 75 XP. O passaporte agrega as conclusões existentes sem criar uma nova fonte de verdade. Os dez níveis são derivados do XP; o ranking usa consultas indexadas para exibir Top 3 ou Top 10 e uma janela contextual com até três posições de cada lado do participante. Tickets começam com uma concessão no onboarding e podem ser obtidos pela conversão idempotente de cada 200 XP ainda não utilizados, sem reduzir nível ou ranking. A rota temporária `/design-system` foi removida durante o polimento.

A Fase 17 cobre conversões, brindes, controles operacionais, fechamento
retomável e sorteios ponderados. Uma execução administrativa isolada permite
ensaiar fechamento, re-rolagens, confirmações e consumo de tickets sem alterar
o evento real. Problemas encontrados depois da validação da fase serão tratados
como correções de bugs ou melhorias.

## Fase 19: polimento em andamento

O layout compartilhado oferece o link “Pular para o conteúdo”, visível ao
receber foco pelo teclado, com destino no conteúdo principal focável.

A Home agora orienta a primeira conexão e a coleção mais próxima de completar,
mostra o progresso de conversão de XP em tickets. O Perfil oferece ajuda rápida.
Essas orientações usam as regras existentes e não exigem novas operações da staff.

O scanner diferencia conexões novas e repetidas, mantém a câmera parada nos
resultados e oferece recuperação para falhas de transporte e timeout.
Resultados de empresas, tags e missões têm atalhos para continuar a jornada.

O banner de coleção completa só é montado após confirmar uma conquista
recente ainda não exibida. Banners inativos não deixam uma camada invisível
sobre o header, preservando o clique no retorno do Passaporte.

Retornos do header usam destinos centralizados, e etapas transitórias de scan,
revisão, atendimento e edição são substituídas no histórico ao terminar.
Testes verificam destinos por rota e papel e as saídas dos resultados de QR.

Para concluir a fase, ainda é necessário validar:

- navegação por teclado, foco e leitura assistiva nos fluxos principais;
- câmera e scanner em celular real, incluindo recusa de permissão;
- estados de carregamento, vazio e erro com conexão instável;
- responsividade, contraste e preferência por movimento reduzido;
- desempenho das rotas com dados representativos do evento.

Essas verificações complementam `pnpm check` e `pnpm build`; a aprovação dos
comandos, isoladamente, não encerra a fase.

## MVP

O MVP inclui autenticação, perfil, onboarding, navegação, empresas, tags, missões, passaporte, QR Code, scanner, networking, palestras, ranking e tickets para sorteios. Operações de pontuação, scans e tickets são validadas no servidor.

## Fases

| Fase                          | Entrega principal                                  | Dependência                |
| ----------------------------- | -------------------------------------------------- | -------------------------- |
| 1. Fundação                   | Next.js, TypeScript, estilos, qualidade e ambiente | —                          |
| 2. Design System              | tokens, componentes base e shell mobile            | Fundação                   |
| 3. Autenticação               | Google, sessão e proteção de rotas                 | Ambiente                   |
| 4. Perfil                     | schema, persistência, edição e QR do participante  | Autenticação               |
| 5. Onboarding                 | fluxo inicial e conclusão de perfil                | Perfil                     |
| 6. Navegação                  | layout autenticado, header e menu inferior         | Design System              |
| 7. Home                       | resumo e atalhos das atividades                    | Perfil e navegação         |
| 8. QR Code                    | formato, geração e validação central               | Autenticação e Firestore   |
| 9. Scanner                    | câmera, leitura e estados de resposta              | QR Code                    |
| 10. Networking                | criação automática, XP e remoção de conexões       | Scanner e perfil           |
| 11. Empresas                  | catálogo, detalhes e registro de visita            | Scanner                    |
| 12. Tags                      | QR fixo, descoberta única e XP                     | Scanner e perfil           |
| 13. Missões                   | catálogo, critérios e conclusão                    | Empresas e perfil          |
| 14. Passaporte                | progresso de empresas, tags e missões              | Empresas, tags e missões   |
| 15. Ranking                   | XP, níveis e classificação                         | Interações anteriores      |
| 16. Badges (removida)         | funcionalidade retirada do produto                 | —                          |
| 17. Tickets                   | conversão de XP, brindes e sorteios ponderados     | XP e operações             |
| 18. Palestras                 | catálogo, detalhes e avaliação liberada pelo admin | Perfil                     |
| 19. Polimento                 | acessibilidade, desempenho e estados de UI         | MVP funcional              |
| 20. Integração administrativa | contratos externos, permissões e cache             | Catálogos configuráveis    |
| 21. Lançamento                | observabilidade, segurança e deploy                | Todas as fases necessárias |
| 22. Escalabilidade do ranking | consulta indexada, paginação e redução de leituras | MVP entregue               |
| 23. Resumo individual leve    | contadores transacionais exibidos na Home          | Interações do participante |
| 24. Cronograma                | faixas, salas, atividades e sessões paralelas      | Palestras e palestrantes   |

## Marcos

1. **Base técnica:** fundação, Design System e autenticação.
2. **Participante pronto:** perfil, onboarding, navegação e home.
3. **Interações reais:** QR Code, scanner, networking, empresas e palestras.
4. **Gamificação:** tags, missões, passaporte e ranking.
5. **Sorteios:** ticket inicial e conversões de XP idempotentes, com brindes e sorteios auditáveis.
6. **Produção:** polimento, observabilidade e deploy.
7. **Escalabilidade:** cache dos catálogos, ranking indexado e resumo individual leve.

## Prioridades

- **Crítica:** autenticação, perfil, segurança, QR Code e scanner.
- **Alta:** empresas, tags, missões, passaporte e networking.
- **Média:** palestras, ranking e tickets.
- **Posterior:** integrações adicionais com o painel administrativo externo e expansões não essenciais.

## Critérios comuns de aceite

Uma fase só está concluída quando:

- o fluxo principal e os estados de erro funcionam em celular;
- entradas, sessão e autorização são validadas no servidor;
- operações críticas são idempotentes ou transacionais quando necessário;
- acessibilidade básica e conexão instável foram consideradas;
- documentação relacionada está atualizada;
- `npm run check` e `npm run build` passam.

## Riscos

| Risco                   | Mitigação principal                                              |
| ----------------------- | ---------------------------------------------------------------- |
| internet instável       | exigir conexão nos scans, usar respostas pequenas e retry seguro |
| pico de acessos         | consultas indexadas, paginação e testes de carga                 |
| fraude em QR Code       | identificadores públicos, validação e idempotência no servidor   |
| tickets duplicados      | chave idempotente por concessão, conversão e operação            |
| concorrência no ranking | atualizações atômicas e cálculo controlado pelo servidor         |

## Fora do escopo inicial

- chat e notificações em tempo real;
- pagamentos;
- aplicativo nativo;
- funcionamento totalmente offline;
- múltiplos eventos simultâneos na interface.

## Próximo documento

➡️ [Fluxo de desenvolvimento](./07-development-workflow.md)
