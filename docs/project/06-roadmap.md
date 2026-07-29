# Roadmap

O desenvolvimento é incremental. Cada fase deve entregar uma parte utilizável, manter o projeto validável e atualizar a documentação afetada.

Status atual: Fases 1 (Fundação), 2 (Design System), 3 (Autenticação), 4 (Perfil), 5 (Onboarding), 6 (Navegação), 7 (Home), 8 (QR Code), 9 (Scanner), 10 (Networking), 11 (Empresas), 12 (Tags), 13 (Missões), 14 (Passaporte), 15 (Ranking) e 16 (Badges) concluídas. A Fase 17 (Tickets) está em desenvolvimento. O networking cria a conexão automaticamente após uma leitura válida, concede 5 XP a cada participante e permite que qualquer uma das partes remova a conexão, revogando a pontuação de ambas. Empresas ativas possuem um QR Code fixo; a primeira leitura registra permanentemente visita, carimbo e XP em uma transação idempotente. O catálogo e os detalhes exibem o progresso real do participante. Tags ativas usam QR Codes fixos e concedem XP uma única vez; a coleção mantém itens ainda não encontrados anônimos e revela seus dados após a descoberta permanente. Os valores padrão de XP ficam centralizados em `config/scores.ts`, e cada conclusão preserva o valor efetivamente concedido. O contrato central aceita QR Codes de participante, empresa, missão e tag; palestras não possuem QR Code e terão avaliações liberadas pelo horário de encerramento. O passaporte agrega as conclusões existentes sem criar uma nova fonte de verdade. Os dez níveis são derivados do XP; o ranking exibe Top 3 ou Top 10 e uma janela contextual com até três posições de cada lado do participante. Badges são conquistas visuais retroativas, idempotentes e baseadas somente em empresas, tags e missões permanentes. Tickets começam com uma concessão no onboarding e podem ser obtidos pela conversão de cada 200 XP ainda não utilizados, sem reduzir nível ou ranking. A rota temporária `/design-system` permanece disponível durante o desenvolvimento e deve ser removida na conclusão do MVP.

## MVP

O MVP inclui autenticação, perfil, onboarding, navegação, empresas, tags, missões, passaporte, QR Code, scanner, networking, palestras, ranking, badges e tickets para sorteios. Operações de pontuação, scans e tickets são validadas no servidor.

## Fases

| Fase                          | Entrega principal                                   | Dependência                   |
| ----------------------------- | --------------------------------------------------- | ----------------------------- |
| 1. Fundação                   | Next.js, TypeScript, estilos, qualidade e ambiente  | —                             |
| 2. Design System              | tokens, componentes base e shell mobile             | Fundação                      |
| 3. Autenticação               | Google, sessão e proteção de rotas                  | Ambiente                      |
| 4. Perfil                     | schema, persistência, edição e QR do participante   | Autenticação                  |
| 5. Onboarding                 | fluxo inicial e conclusão de perfil                 | Perfil                        |
| 6. Navegação                  | layout autenticado, header e menu inferior          | Design System                 |
| 7. Home                       | resumo e atalhos das atividades                     | Perfil e navegação            |
| 8. QR Code                    | formato, geração e validação central                | Autenticação e Firestore      |
| 9. Scanner                    | câmera, leitura e estados de resposta               | QR Code                       |
| 10. Networking                | criação automática, XP e remoção de conexões        | Scanner e perfil              |
| 11. Empresas                  | catálogo, detalhes e registro de visita             | Scanner                       |
| 12. Tags                      | QR fixo, descoberta única e XP                      | Scanner e perfil              |
| 13. Missões                   | catálogo, critérios e conclusão                     | Empresas e perfil             |
| 14. Passaporte                | progresso de empresas, tags e missões               | Empresas, tags e missões      |
| 15. Ranking                   | XP, níveis e classificação                          | Interações anteriores         |
| 16. Badges                    | critérios individuais e compostos                   | Ranking, tags e missões       |
| 17. Tickets                   | conversão, brindes, operações e sorteios ponderados | XP e níveis                   |
| 18. Palestras                 | agenda e missão de avaliação após encerramento      | Perfil                        |
| 19. Polimento                 | acessibilidade, desempenho e estados de UI          | MVP funcional                 |
| 20. Integração administrativa | contratos com o painel externo                      | Funcionalidades configuráveis |
| 21. Lançamento                | observabilidade, segurança e deploy                 | Todas as fases necessárias    |
| 22. Escalabilidade do ranking | consulta indexada, paginação e redução de leituras  | MVP entregue                  |

## Marcos

1. **Base técnica:** fundação, Design System e autenticação.
2. **Participante pronto:** perfil, onboarding, navegação e home.
3. **Interações reais:** QR Code, scanner, networking, empresas e palestras.
4. **Gamificação:** tags, missões, passaporte, ranking e badges.
5. **Sorteios:** tickets concedidos de forma idempotente por nível.
6. **Produção:** polimento, observabilidade e deploy.
7. **Pós-MVP:** ranking preparado para a escala real do evento.

## Prioridades

- **Crítica:** autenticação, perfil, segurança, QR Code e scanner.
- **Alta:** empresas, tags, missões, passaporte e networking.
- **Média:** palestras, ranking, badges e tickets.
- **Posterior:** escalabilidade do ranking, integrações adicionais com o painel administrativo externo e expansões não essenciais.

## Critérios comuns de aceite

Uma fase só está concluída quando:

- o fluxo principal e os estados de erro funcionam em celular;
- entradas, sessão e autorização são validadas no servidor;
- operações críticas são idempotentes ou transacionais quando necessário;
- acessibilidade básica e conexão instável foram consideradas;
- documentação relacionada está atualizada;
- `pnpm check` e `pnpm build` passam.

## Riscos

| Risco                   | Mitigação principal                                              |
| ----------------------- | ---------------------------------------------------------------- |
| internet instável       | exigir conexão nos scans, usar respostas pequenas e retry seguro |
| pico de acessos         | consultas indexadas, paginação e testes de carga                 |
| fraude em QR Code       | identificadores públicos, validação e idempotência no servidor   |
| tickets duplicados      | chave idempotente por participante e nível                       |
| concorrência no ranking | atualizações atômicas e cálculo controlado pelo servidor         |

## Fora do escopo inicial

- chat e notificações em tempo real;
- pagamentos;
- aplicativo nativo;
- funcionamento totalmente offline;
- múltiplos eventos simultâneos na interface.

## Próximo documento

➡️ [Fluxo de desenvolvimento](./07-development-workflow.md)
