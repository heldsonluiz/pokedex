# Firestore Rules

As regras seguem menor privilégio. O Firebase Admin ignora Firestore Rules, portanto serviços de servidor também devem validar sessão, autorização e dados.

## Matriz de acesso do cliente

| Recurso                                                                          | Leitura                                         | Escrita                                   |
| -------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------- |
| `events`                                                                         | dados públicos do evento ativo                  | servidor                                  |
| `companies`, `tags`, `missions`, `speakers`, `talks`, `scheduleSlots`, `rewards` | usuários autorizados conforme produto           | servidor                                  |
| `tickets`                                                                        | próprios tickets                                | servidor                                  |
| `profiles`                                                                       | próprio perfil e projeção pública permitida     | próprio usuário, somente campos editáveis |
| `connections`                                                                    | conexões do próprio participante                | servidor                                  |
| `activityCompletions`                                                            | próprias conclusões e carimbos                  | servidor                                  |
| `participantSummaries`                                                           | próprio resumo individual                       | servidor                                  |
| `rewardRedemptions`                                                              | próprios resgates                               | servidor                                  |
| `raffleSkippedProfiles`                                                          | administrador                                   | servidor                                  |
| `scans`                                                                          | scans do próprio participante quando necessário | servidor                                  |
| `talk-ratings`                                                                   | própria avaliação quando necessária             | servidor                                  |
| ranking                                                                          | projeção pública mínima de participantes        | servidor                                  |

## Perfil

O cliente nunca pode alterar campos controlados pelo servidor, incluindo:

```text
xp
xpReachedAt
convertedXp
ticketBalance
level
qrId
userId
eventId
createdAt
updatedAt
accessRoles
```

As Rules devem comparar campos alterados e validar tipos/limites básicos. Regras de domínio complexas permanecem no servidor.

## Operações críticas

Visitas, descobertas de tags, conclusões de missões, avaliações, scans, conexões, ranking e tickets são persistidos somente pelo backend. `accessRoles` não é gravável pela edição de perfil e toda permissão é validada novamente no servidor. O painel administrativo pertence a outro projeto e acessa os dados por uma integração de servidor autorizada.

Os resumos individuais também são gravados somente pelo backend. Eles são uma
projeção derivada e nunca substituem `activityCompletions`, `connections` ou
`profiles` na validação de uma operação.

O ranking é carregado pelo servidor e expõe somente posição, nome, avatar, XP e
nível derivado. E-mail, empresa, link, skills e papéis internos não fazem parte
da projeção.

## Testes obrigatórios

Use o Emulator Suite para provar que:

- usuário não autenticado é bloqueado;
- usuário lê e edita somente dados permitidos;
- campos protegidos do perfil não podem ser alterados;
- acesso a dados de outro participante é negado;
- coleções críticas rejeitam escrita do cliente;
- consultas legítimas continuam funcionando.

## Próximo documento

➡️ [Server Actions](./06-server-actions.md)
