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
| `connections`         | networking              | `eventId`, perfis, status, solicitação, aceite, remoção e XP concedida                            |
| `scans`               | histórico de leituras   | `eventId`, perfil, tipo, alvo, QR e timestamp                                                     |
| `talk-ratings`        | avaliações de palestras | `eventId`, palestra, avaliador, respostas e timestamp                                             |

Schemas completos devem existir no código e ser validados com Zod. Este documento registra o modelo conceitual, não substitui os contratos tipados.

## Relacionamentos e IDs

- documentos relacionados ao evento carregam `eventId`;
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
- aceitar uma conexão concede XP uma única vez; removê-la revoga a XP na mesma operação, sem apagar o histórico;
- cada nível concede no máximo um ticket por participante, usando chave idempotente;
- avaliações exigem presença registrada e são únicas por participante e palestra;
- operações concorrentes usam transações ou atualizações atômicas;
- regras de segurança seguem menor privilégio;
- dados públicos e privados do perfil devem ser separados na leitura ou projeção;
- nenhuma entrada do cliente é persistida sem validação e autorização.

## Próximo documento

➡️ [Autenticação](./02-authentication.md)
