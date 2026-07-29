# Firestore

## Coleções

| Coleção               | Finalidade               | Campos essenciais                                                                        |
| --------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `events`              | configuração do evento   | `name`, `slug`, `startsAt`, `endsAt`, `isActive`                                         |
| `profiles`            | participante             | `userId`, `eventId`, dados públicos, `qrId`, `xp`, `xpReachedAt`, onboarding, timestamps |
| `companies`           | patrocinadores           | `eventId`, nome, descrição, imagens, `qrId`, estado e XP opcional                        |
| `tags`                | itens escondidos         | `eventId`, nome, descrição, imagem, `qrId`, estado, ordem e XP opcional                  |
| `talks`               | palestras                | `eventId`, título, palestrante, horários, sala e liberação da avaliação                  |
| `missions`            | missões                  | evento, conteúdo, validação, pré-requisitos, QR opcional, XP, estado e ordem             |
| `badges`              | definições de conquistas | evento, conteúdo, imagem, visibilidade, critério, estado, ordem e timestamps             |
| `participantBadges`   | badges conquistadas      | evento, participante, badge e data da conquista                                          |
| `ticketTransactions`  | movimentações de tickets | evento, participante, tipo, quantidade, XP convertido, operador, referência e timestamp  |
| `eventOperations`     | controles operacionais   | evento, conversões, resgates, fechamento e responsável                                   |
| `rewards`             | catálogo de brindes      | evento, conteúdo, custo, estoque, limites e estado                                       |
| `rewardRedemptions`   | resgates de brindes      | evento, participante, brinde, quantidade, custo, operador e timestamp                    |
| `raffles`             | sorteios ponderados      | evento, prêmio, estado, fotografia, universo elegível e vencedor                         |
| `connections`         | networking               | `eventId`, perfis, status, criação, remoção e XP concedida                               |
| `activityCompletions` | progresso e carimbos     | evento, participante, tipo, entidade, QR, XP concedida e conclusão                       |
| `scans`               | histórico de leituras    | `eventId`, perfil, tipo, alvo, QR e timestamp                                            |
| `talk-ratings`        | avaliações de palestras  | `eventId`, palestra, avaliador, respostas e timestamp                                    |

Schemas completos devem existir no código e ser validados com Zod. Este documento registra o modelo conceitual, não substitui os contratos tipados.

### Badges

Cada documento de `badges` pertence a um evento e possui `name`,
`description`, `imageUrl`, `visibility`, `criterion`, `active`, `order`,
`createdAt` e `updatedAt`. A visibilidade pode ser `public` ou `secret`;
conquistas secretas ocultam conteúdo e critério até serem obtidas.

Os critérios aceitos são:

- `activity`: exige uma empresa, tag ou missão específica;
- `activityCount`: exige uma quantidade mínima de um tipo de atividade;
- `allOf`: exige todos os critérios internos;
- `anyOf`: exige pelo menos um dos critérios internos.

Conexões não participam dos critérios porque podem ser removidas. A avaliação
usa as conclusões permanentes de `activityCompletions`, não concede XP e também
considera atividades anteriores à criação da badge.

Cada conquista é registrada uma única vez em `participantBadges`. O ID é um
hash determinístico de `eventId + participantId + badgeId`, tornando a
concessão idempotente. Badges inativas deixam de gerar conquistas, mas
conquistas já registradas continuam visíveis. A avaliação acontece após novas
conclusões e novamente ao abrir a coleção, corrigindo eventuais falhas sem
reverter a atividade principal.

### Perfil implementado

O contrato inicial de `profiles` possui `userId`, `eventId`, `displayName`, `email`, `avatarUrl`, `bio`, `role`, `company`, `link`, `skills`, `qrId`, `onboardingCompleted`, `createdAt` e `updatedAt`. `qrId` é um UUID v4 público e estável, diferente do ID interno do documento. A criação usa uma transação em `profiles/{userId}`: se o documento já existir, nenhuma nova gravação é feita. O repositório valida documentos lidos com Zod e converte `Timestamp` para `Date` antes de devolvê-los ao domínio.

`displayName` e `skills` são obrigatórios para concluir o perfil. O nome possui no mínimo 3 caracteres; `skills` armazena de 3 a 5 slugs únicos existentes no catálogo estático `data/skills.ts`; `bio` é opcional e aceita no máximo 200 caracteres; `role` é opcional e aceita no máximo 80 caracteres; `company` é opcional e aceita no máximo 100 caracteres; `link` é opcional e aceita uma única URL válida. Antes da conclusão, o documento pode manter `skills` vazio e os campos opcionais nulos.

A edição em `/profile/edit` envia somente esses campos editáveis para uma Server Action autenticada. O serviço valida novamente o contrato e o repositório atualiza o documento existente em transação, preservando identidade, evento, QR Code e datas de criação.

`accessRoles` armazena uma ou mais autorizações internas entre `participant`,
`staff`, `reviewer`, `editor` e `admin`. Novos perfis recebem
`["participant"]`; o campo não participa da edição do perfil. `role` continua
representando somente o cargo público. Todas as contas concluem normalmente o
onboarding. Apenas `participant` participa das atividades e recebe XP;
`reviewer` e `admin` podem validar missões presenciais.

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
`SCORES.PARTICIPANT_CONNECTION`. A conexão e os dois perfis são atualizados na mesma
transação. A remoção por qualquer participante subtrai de ambos exatamente o
valor registrado na conexão, também atomicamente, sem apagar o histórico.

### Empresas e visitas

Cada documento de `companies` possui `eventId`, um único `qrId` público,
`name`, `description`, `logoUrl`, `stampImageUrl`, `active`, `xpAwarded`,
`createdAt` e `updatedAt`. `stampImageUrl` é opcional; o passaporte usa
`logoUrl` como fallback. `xpAwarded` também é opcional e, quando ausente, a
visita usa `SCORES.COMPANY_VISIT`.

O QR Code identifica a empresa, mas não autoriza nem pontua sozinho. O servidor
valida sessão, evento, perfil concluído, existência e estado ativo dentro do
caso de uso.

A primeira visita cria um documento em `activityCompletions` e soma XP ao
perfil na mesma transação. O ID da conclusão é um hash determinístico de
`eventId`, participante, tipo `company` e ID interno da empresa. Assim,
releituras simultâneas ou posteriores retornam a conclusão existente sem criar
outro carimbo ou conceder XP novamente.

A conclusão registra `activityId`, `qrId`, `xpAwarded` e `completedAt`. Esse
registro representa também o carimbo da empresa e preserva o valor realmente
concedido mesmo que a configuração padrão seja alterada depois.

Visitas e carimbos são permanentes. Não existe operação de remoção, revogação
de XP ou nova conclusão para a mesma empresa.

O catálogo consulta as empresas do evento, filtra somente as ativas e ordena
os resultados por nome. O estado dos carimbos é obtido pelas conclusões do
participante. No detalhe, o ID determinístico permite buscar diretamente a
visita daquela empresa.

### Tags e descobertas

Cada documento de `tags` possui `eventId`, um único `qrId` público, `name`,
`description`, `imageUrl`, `active`, `order`, `xpAwarded`, `createdAt` e
`updatedAt`. Quando `xpAwarded` é nulo, a descoberta usa
`SCORES.TAG_DISCOVERY`.

A primeira leitura cria uma conclusão de tipo `tag` em
`activityCompletions` e soma XP ao perfil na mesma transação. O ID é um hash
determinístico de evento, participante, tipo e ID interno da tag. Descobertas e
XP são permanentes; releituras retornam o registro existente.

A coleção consulta somente tags ativas. Para itens ainda bloqueados, o service
projeta apenas um número de slot, sem enviar ID, nome, descrição ou imagem ao
cliente. Depois da descoberta, esses dados são revelados junto ao XP realmente
concedido.

### Missões

Cada missão possui `validationType` igual a `qr` ou `reviewer`. Missões `qr`
possuem um `qrId` fixo; missões `reviewer` não possuem QR próprio. Ambas podem
declarar pré-requisitos de visita a empresa ou conclusão de outra missão.

Na validação presencial, um usuário `reviewer` ou `admin` escolhe a missão e
escaneia o QR temporário do participante. Não existe submissão pendente: a
aprovação cria diretamente uma conclusão de tipo `mission`, registrando
`validationType`, `validatedBy`, `validatedAt`, `xpAwarded` e `completedAt`.

O ID determinístico combina evento, participante, tipo `mission` e missão.
Perfil, autorização, estado da missão, pré-requisitos e duplicidade são
validados no servidor. A conclusão e o crédito de XP ocorrem na mesma
transação. Somente perfis com `participant` recebem a conclusão e os pontos.

### Passaporte

O passaporte não possui coleção própria. Ele combina as entidades ativas e as
conclusões de `company`, `tag` e `mission` já armazenadas em
`activityCompletions`. Essa projeção calcula totais, progresso, XP conquistado
nessas atividades e conquistas recentes sem duplicar dados ou executar
gravações.

Somente perfis com `participant` recebem a projeção. Os valores de XP são
obtidos das conclusões persistidas, preservando a recompensa efetivamente
concedida. Tags bloqueadas continuam anônimas.

### Níveis e ranking

As dez faixas ficam centralizadas em `config/levels.ts`. O nível é derivado do
XP atual e não é persistido no perfil. A interface sempre combina número e
título, de `Nível 1 · Newbie` até `Nível 10 · Mestre do Endgame`. O último
nível começa em 4.000 XP; valores superiores continuam válidos para diferenciar
participantes no ranking.

O ranking consulta somente perfis concluídos do evento com `accessRoles`
contendo `participant`. A ordem usa `xp` decrescente, `xpReachedAt` crescente e
ID do documento crescente. O ID resolve o caso raro de XP e timestamp
idênticos.

Durante o MVP, o servidor busca os perfis do evento, filtra os participantes e
ordena o resultado em memória. A classificação completa usa cache compartilhado
de 60 segundos; por isso, atualizações de XP podem levar até esse intervalo para
aparecer. Essa solução temporária elimina a dependência imediata de um índice
composto, mas seu custo cresce linearmente com o número de perfis.

Participantes entre os três primeiros recebem a lista das dez primeiras
posições. Os demais recebem o Top 3 e uma janela contextual com até três
posições anteriores e três posteriores, sem repetir o pódio. Depois do MVP, o
ranking deverá migrar para
consulta indexada e paginada ou para uma projeção própria de leaderboard.

### Tickets, brindes e sorteios

Concluir o onboarding concede um ticket inicial. A concessão também é
retroativa para participantes existentes. Depois disso, cada 200 XP ainda não
convertidos pode gerar um ticket. A conversão manual permanece disponível
enquanto `eventOperations.ticketConversionEnabled` estiver ativo.

O perfil mantém `ticketBalance` e `convertedXp` como projeções controladas pelo
servidor. Converter XP incrementa `convertedXp` sem reduzir `xp`; assim, nível e
ranking continuam representando a participação. Se uma conexão removida fizer
o XP ficar abaixo do total já convertido, novas conversões permanecem
indisponíveis até que o participante recupere a diferença.

`ticketTransactions` é o histórico auditável. Concessões, conversões, resgates
e ajustes nunca são representados somente por uma alteração de saldo. O ticket
inicial usa ID determinístico; conversões usam uma chave de idempotência
validada pelo servidor.

Brindes possuem custo e estoque. Reviewer e admin podem escanear o QR pessoal
do participante para converter XP ou resgatar brindes. Somente admin pode
bloquear conversões e resgates, liberar avaliações, fechar o evento e realizar
sorteios.

Cada documento de `rewards` possui nome, descrição, imagem, custo em tickets,
estoque, limite opcional por participante, estado e ordem. O agregado
determinístico em `rewardRedemptions` registra quantidade e custo total daquele
brinde para o participante. Cada entrega também cria uma movimentação negativa
em `ticketTransactions`.

Saldo, estoque, limite, agregado e movimentação são validados e atualizados na
mesma transação. Uma chave de idempotência impede que a repetição da confirmação
consuma tickets ou estoque novamente.

No fechamento, todo XP restante conversível é transformado em tickets e os
saldos elegíveis são congelados. O sorteio é ponderado pelo saldo: cada ticket
representa uma chance. Todo vencedor é excluído dos sorteios seguintes.

## Relacionamentos e IDs

- documentos relacionados ao evento carregam `eventId`;
- `eventId` vem da variável privada `EVENT_ID` configurada por implantação;
- referências usam IDs simples quando não houver benefício claro em `DocumentReference`;
- IDs internos do Firestore não são colocados em QR Codes;
- entidades escaneáveis possuem `qrId` público, aleatório e único no evento;
- conexões, scans e conclusões devem possuir chave ou regra que impeça duplicidade lógica;
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
- ranking por evento, papel de participante, XP e `xpReachedAt`;
- avaliações por palestra e perfil;
- busca de entidades por `eventId`, tipo e `qrId`.

Use paginação em listas potencialmente grandes e selecione somente os dados necessários.

## Integridade e segurança

- pontuação, badges, scans, conexões e tickets são escritos pelo servidor;
- criar uma conexão concede XP uma única vez; removê-la revoga a XP na mesma operação, sem apagar o histórico;
- o onboarding e as movimentações de tickets usam chaves idempotentes e histórico auditável;
- avaliações são liberadas após o encerramento configurado, concluem sua missão e são únicas por participante e palestra;
- operações concorrentes usam transações ou atualizações atômicas;
- regras de segurança seguem menor privilégio;
- dados públicos e privados do perfil devem ser separados na leitura ou projeção;
- nenhuma entrada do cliente é persistida sem validação e autorização.

## Próximo documento

➡️ [Autenticação](./02-authentication.md)
