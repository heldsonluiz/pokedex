# Firestore

## Coleções

| Coleção               | Finalidade              | Campos essenciais                                                                                 |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `events`              | configuração do evento  | `name`, `slug`, `startsAt`, `endsAt`, `isActive`                                                  |
| `profiles`            | participante            | `userId`, `eventId`, dados públicos, `qrId`, `level`, `xp`, `xpReachedAt`, onboarding, timestamps |
| `companies`           | patrocinadores          | `eventId`, `name`, `category`, descrição, links, `qrId`, `order`                                  |
| `talks`               | palestras               | `eventId`, título, palestrante, horários, sala, `qrId`                                            |
| `missions`            | missões                 | `eventId`, título, tipo, XP, estado e ordem                                                       |
| `mission-submissions` | validações de missões   | `eventId`, missão, perfil, status, revisor e timestamps                                           |
| `badges`              | conquistas              | `eventId`, nome, descrição, ícone e visibilidade                                                  |
| `tickets`             | entradas para sorteios  | `eventId`, `profileId`, nível de origem, sorteio e timestamp                                      |
| `connections`         | networking              | `eventId`, perfis, status, criação, remoção e XP concedida                                        |
| `scans`               | histórico de leituras   | `eventId`, perfil, tipo, alvo, QR e timestamp                                                     |
| `talk-ratings`        | avaliações de palestras | `eventId`, palestra, avaliador, respostas e timestamp                                             |

Schemas completos devem existir no código e ser validados com Zod. Este documento registra o modelo conceitual, não substitui os contratos tipados.

### Perfil implementado

O contrato inicial de `profiles` possui `userId`, `eventId`, `displayName`, `email`, `avatarUrl`, `bio`, `role`, `company`, `link`, `skills`, `qrId`, `onboardingCompleted`, `createdAt` e `updatedAt`. `qrId` é um UUID v4 público e estável, diferente do ID interno do documento. A criação usa uma transação em `profiles/{userId}`: se o documento já existir, nenhuma nova gravação é feita. O repositório valida documentos lidos com Zod e converte `Timestamp` para `Date` antes de devolvê-los ao domínio.

`displayName` e `skills` são obrigatórios para concluir o perfil. O nome possui no mínimo 3 caracteres; `skills` armazena de 3 a 5 slugs únicos existentes no catálogo estático `data/skills.ts`; `bio` é opcional e aceita no máximo 200 caracteres; `role` é opcional e aceita no máximo 80 caracteres; `company` é opcional e aceita no máximo 100 caracteres; `link` é opcional e aceita uma única URL válida. Antes da conclusão, o documento pode manter `skills` vazio e os campos opcionais nulos.

A edição em `/profile/edit` envia somente esses campos editáveis para uma Server Action autenticada. O serviço valida novamente o contrato e o repositório atualiza o documento existente em transação, preservando identidade, evento, QR Code e datas de criação.

No setup obrigatório, a mesma transação persiste os campos validados e define `onboardingCompleted: true`. Cancelar o setup não altera o documento; voltar apenas reinicia as etapas introdutórias.

Os campos `xp` e `xpReachedAt` armazenam a pontuação atual e o instante em que
ela foi atingida. Os valores concedidos por cada interação ficam centralizados
em `config/scores.ts`; o cliente não informa nem calcula pontuação.

### Networking

Cada documento de `connections` representa um único par de participantes no
evento. O ID é um hash determinístico do `eventId` e dos dois IDs de participante
em ordem canônica; por isso, leituras em sentidos opostos não criam
documentos duplicados.

O contrato possui `participantIds`, `requesterId`, `recipientId`, `status`,
`requestCount`, `firstRequestedAt`, `lastRequestedAt`, `acceptedAt`,
`rejectedAt`, `removedAt`, `removedBy`, `createdAt` e `updatedAt`. Os estados
`pending` e `rejected` permanecem reconhecidos para compatibilidade com dados
anteriores, mas o fluxo atual cria a conexão diretamente como `accepted`. Uma
nova leitura após remoção reutiliza o documento, incrementa `requestCount` e
preserva o histórico.

O intervalo de um minuto bloqueia somente a recriação do mesmo par após uma
remoção. A leitura de uma conexão já ativa retorna o estado atual de forma
idempotente e não concede XP novamente.

O contrato registra `xpAwardedPerParticipant`, `xpGrantedAt` e `xpRevokedAt`.
Ao criar a conexão, os dois participantes recebem os 5 XP definidos por
`SCORES.CONNECTION`. A conexão e os dois perfis são atualizados na mesma
transação. A remoção por qualquer participante subtrai de ambos exatamente o
valor registrado na conexão, também atomicamente, sem apagar o histórico.

## Relacionamentos e IDs

- documentos relacionados ao evento carregam `eventId`;
- `eventId` vem da variável privada `EVENT_ID` configurada por implantação;
- referências usam IDs simples quando não houver benefício claro em `DocumentReference`;
- IDs internos do Firestore não são colocados em QR Codes;
- entidades escaneáveis possuem `qrId` público, aleatório e único no evento;
- conexões e scans devem possuir chave ou regra que impeça duplicidade lógica;
- `xpReachedAt` registra quando o participante atingiu a pontuação atual e resolve empates no ranking.

## Datas e exclusão

- use `Timestamp` do Firestore e horário gerado no servidor;
- mantenha `createdAt` e `updatedAt` quando relevantes;
- prefira desativação ou arquivamento para conteúdo com histórico;
- exclusão definitiva exige verificar relações e requisitos de privacidade.

## Consultas e índices

Modele consultas antes de criar índices. Casos previstos incluem:

- dados por `eventId` e estado;
- empresas e missões ordenadas;
- submissões pendentes por evento e revisor;
- scans e conexões por perfil;
- ranking por XP;
- avaliações por palestra e perfil;
- busca de entidades por `eventId`, tipo e `qrId`.

Use paginação em listas potencialmente grandes e selecione somente os dados necessários.

## Integridade e segurança

- pontuação, badges, scans, conexões e tickets são escritos pelo servidor;
- criar uma conexão concede XP uma única vez; removê-la revoga a XP na mesma operação, sem apagar o histórico;
- cada nível concede no máximo um ticket por participante, usando chave idempotente;
- avaliações exigem presença registrada e são únicas por participante e palestra;
- operações concorrentes usam transações ou atualizações atômicas;
- regras de segurança seguem menor privilégio;
- dados públicos e privados do perfil devem ser separados na leitura ou projeção;
- nenhuma entrada do cliente é persistida sem validação e autorização.

## Próximo documento

➡️ [Autenticação](./02-authentication.md)
