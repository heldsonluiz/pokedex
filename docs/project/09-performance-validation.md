# Validação de desempenho

## Cenário

Estimativa informada pelo responsável: 1.700 participantes, 50% a 60% com
login e 30% a 50% usando a Pokédex ativamente. Para esta medição, ambos os
percentuais foram interpretados sobre o público total: até 1.020 logins e
850 participantes ativos. Atividade durante o evento não significa acesso
simultâneo.

O script `scripts/validate-performance.mjs` adiciona 1.020 perfis temporários
às coleções `test_`, preservando os dados existentes. Destes, 850 recebem
histórico com até quatro visitas a empresas, oito tags e duas conexões por
participante. Os demais têm perfil concluído e nenhum histórico de atividade.
O perfil e o resumo individual recebem contadores e XP consistentes com essa
massa. Não são criadas contas no Google ou no Firebase Authentication.

## Execução

Na raiz do projeto, com `.env.local` apontando para o ambiente de testes e
`DEVMODE=true`:

```bash
pnpm build
node scripts/validate-performance.mjs
node scripts/validate-performance.mjs --apply
```

Sem `--apply`, o comando apenas mostra o plano. Com `--apply`, inicia um
servidor de produção local exclusivo em `127.0.0.1:3107`, cria sessões JWT
sintéticas para os perfis temporários e acessa Home, Passaporte, Ranking,
Empresas, Tags e Conexões. As sessões passam pela autenticação e pelas
consultas reais da aplicação. O fluxo OAuth do Google não é exercitado.

São executadas etapas com 1, 10, 25 e 50 requisições simultâneas, sem intervalo
entre as requisições de cada executor. Isso representa concorrência HTTP,
não uma equivalência direta com quantidade de pessoas. A etapa inicial tem
18 requisições e as demais têm 180 cada. Há ainda uma verificação autenticada
inicial da Home. Para manter cada etapa por pelo menos 30 segundos, use:

```bash
node scripts/validate-performance.mjs --apply --stage-seconds=30
```

Nesse modo, os números de requisições acima passam a ser mínimos. A etapa
continua iniciando requisições até cumprir tanto a quantidade mínima quanto
a duração, e aguarda as requisições em andamento terminarem. A opção aceita
valores inteiros de 0 a 300 segundos; o padrão 0 mantém o teste por quantidade.

A medição vai do início da requisição até a leitura completa do HTML, com
limite de 15 segundos. Redirecionamentos, erros HTTP, timeout e erros de
renderização transmitidos no HTML são tratados como falhas. Uma etapa com
mais de 5% de erros interrompe o aumento de carga. O relatório inclui mediana,
p95, máximo e erros por rota e por etapa. O p95 é o tempo dentro do qual
terminaram 95% das respostas daquela amostra.

Ao terminar, o script encerra seu servidor e remove os documentos temporários.
O relatório JSON, o log do servidor e a lista de caminhos para recuperação da
limpeza ficam em `/tmp/perf-<identificador>-*`. Credenciais e cookies não são
registrados. Se o processo for encerrado à força, a limpeza pode não ocorrer;
a lista de caminhos identifica exclusivamente os documentos daquela execução.

## Limites da medição

- É uma triagem curta, não um teste prolongado de estabilidade.
- O servidor é local e o Firestore é remoto; o resultado não comprova a capacidade da hospedagem de produção.
- As requisições carregam HTML completo, sem executar JavaScript, baixar imagens ou medir a renderização no celular.
- Login pelo Google, scans com gravação, concessão concorrente de XP, tickets e avaliações não fazem parte desta medição.
- A massa exercita visitas, tags e conexões; não cobre histórico extenso de missões ou avaliações.
- Leituras faturadas pelo Firestore, CPU e memória não são medidas.
- Os caches e as conexões podem aquecer entre etapas; diferenças entre etapas não isolam o efeito da concorrência.

## Índice do ranking

A execução inicial encontrou a mensagem de que o índice do ranking estava indisponível.
Uma consulta direta confirmou `The query requires an index` em `test_profiles`.
Naquela execução, a aplicação continuou atendendo por meio do fallback que busca todos os perfis
do evento e mantém o resultado em cache por 60 segundos.

As definições necessárias estão em `firestore.indexes.json`. O resultado
inicial abaixo não deve ser tratado como validação do caminho indexado do ranking.

## Resultado de 9 de setembro de 2026

A execução adicionou 1020 perfis aos 152 existentes,
totalizando 1172 perfis no evento durante a medição. Foram criados e
removidos 13090 documentos temporários. A limpeza terminou com sucesso.

| Requisições simultâneas | Requisições medidas | Erros | Mediana | p95     | Máximo  |
| ----------------------- | ------------------- | ----- | ------- | ------- | ------- |
| 1                       | 18                  | 0     | 1260 ms | 2183 ms | 2183 ms |
| 10                      | 180                 | 0     | 654 ms  | 1237 ms | 1699 ms |
| 25                      | 180                 | 0     | 663 ms  | 857 ms  | 1123 ms |
| 50                      | 180                 | 0     | 897 ms  | 1344 ms | 1535 ms |

As 558 requisições das etapas terminaram sem erros, além da verificação
autenticada inicial da Home. No pico de 50 requisições simultâneas, o p95
foi de 1.344 ms. Essa etapa durou apenas 3,9 segundos; portanto, não comprova
capacidade de sustentação dessa carga durante o evento inteiro.

Os números completos por rota estão no
[relatório JSON](./performance-baseline-2026-09-09.json). As duas execuções
preliminares foram descartadas após correções da massa sintética; seus dados
temporários também foram removidos. Os números acima pertencem somente à
execução completa com os contratos corrigidos.

A medição é uma evidência inicial favorável para navegação no ambiente local,
mas não encerra a validação de desempenho. Naquele momento, os próximos passos eram ativar os índices
do ranking e repetir com duração maior. Operações de gravação concorrentes
e o ambiente equivalente à hospedagem final continuam fora dessa medição.

## Verificação após a ativação do índice principal

A consulta ordenada principal, a contagem de posições e a busca das posições
seguintes passaram no Firestore de testes. A consulta de posições anteriores,
que usa `limitToLast`, ainda retornou `The query requires an index`.

Foi adicionada a definição complementar em `firestore.indexes.json`, tanto
para `test_profiles` quanto para `profiles`: mesmos filtros, com `xp`
crescente, `xpReachedAt` decrescente e `userId` decrescente. O índice principal
deve ser mantido. A medição de carga foi adiada até a ativação desse segundo
índice; nessa verificação foram feitas apenas consultas, sem criar massa de dados.

## Resultado com os dois índices ativos — 9 de setembro de 2026

As consultas de topo, contagem, posições anteriores e posições seguintes
passaram antes da carga. O teste foi repetido com
`--apply --stage-seconds=30`, mantendo cada etapa por pelo menos 30 segundos,
com 1.172 perfis no evento (152 existentes e 1.020 temporários).

| Requisições simultâneas | Requisições medidas | Erros | Duração | Mediana | p95     | Máximo  |
| ----------------------- | ------------------- | ----- | ------- | ------- | ------- | ------- |
| 1                       | 18                  | 0     | 30.7 s  | 1860 ms | 2118 ms | 2118 ms |
| 10                      | 431                 | 0     | 30.6 s  | 730 ms  | 904 ms  | 1742 ms |
| 25                      | 1026                | 0     | 31 s    | 770 ms  | 934 ms  | 1110 ms |
| 50                      | 1661                | 0     | 30.9 s  | 945 ms  | 1140 ms | 1499 ms |

Foram 3.136 requisições medidas sem erros, além da verificação autenticada
inicial da Home. O log completo do servidor não registrou erros de renderização
nem a mensagem de fallback do ranking. Isso confirma que essa execução
exercitou o caminho indexado do ranking.

No pico de 50 requisições simultâneas, o p95 geral foi 1.140 ms; o p95 do
Ranking foi 1.118 ms e o do Passaporte, 1.242 ms. Os 13.090 documentos
temporários foram removidos, e o servidor exclusivo do teste foi encerrado.

Os resultados por rota estão no
[relatório com índices ativos](./performance-indexed-2026-09-09.json).
Não se deve atribuir a diferença dos tempos entre as duas execuções somente
aos índices: duração, quantidade de requisições, caches e conexões diferem.
As leituras faturadas não foram medidas.

A navegação de leitura passou neste cenário local com massa representativa.
Isso resolve a pendência dos índices e amplia a evidência da medição inicial.
Essa medição HTTP não cobre gravações nem o login pelo Google sob carga.
As validações transacional e hospedada posteriores estão descritas a seguir.

## Gravações concorrentes — 9 de setembro de 2026

Seis testes de integração passaram contra o Firestore real de testes,
chamando os repositórios de visitas, tags, missões, conexões e tickets sem
mockar o banco ou as transações. Os testes usaram um evento temporário
exclusivo, 54 perfis e catálogos próprios; não alteraram o evento existente.

Foram 290 chamadas, em grupos de até 50 operações simultâneas, sem erro técnico.
Respostas de repetição e saldo insuficiente eram resultados esperados.
Além das respostas, os testes leram os documentos persistidos para verificar
XP, contadores, quantidade de conclusões e transações de tickets.

| Cenário                                                            | Resultado verificado                                           | p95      |
| ------------------------------------------------------------------ | -------------------------------------------------------------- | -------- |
| 50 novas visitas                                                   | Uma visita e 50 XP por participante                            | 2.442 ms |
| Repetição das 50 visitas                                           | Nenhuma recompensa adicional                                   | 1.159 ms |
| 50 novas tags                                                      | Uma descoberta e 75 XP adicionais por participante             | 1.124 ms |
| Repetição das 50 tags                                              | Nenhuma recompensa adicional                                   | 1.091 ms |
| 25 pares de conexão, lidos nos dois sentidos simultaneamente       | 25 conexões, 5 XP por pessoa                                   | 2.492 ms |
| 16 chamadas de visita, tag, missão e conexão no mesmo participante | 180 XP, três conclusões e uma conexão, sem perda ou duplicação | 5.184 ms |
| Oito concessões simultâneas do ticket inicial                      | Um único ticket inicial                                        | 2.016 ms |
| Oito conversões com a mesma chave                                  | Uma conversão, preservando o XP do ranking                     | 2.769 ms |
| Oito conversões com chaves distintas e saldo limitado              | Duas aprovadas e seis recusadas por saldo insuficiente         | 5.034 ms |

A limpeza removeu os 244 documentos daquele evento temporário.
O [relatório de gravações](./performance-writes-2026-09-09.json) contém
os tempos e a distribuição das respostas.

### Como repetir

Os testes são opt-in e não participam de `pnpm test`. Exigem `.env.local`
com `DEVMODE=true` e autorização explícita pela variável abaixo:

```bash
RUN_FIRESTORE_INTEGRATION=true node --env-file=.env.local node_modules/vitest/vitest.mjs run --config vitest.firestore.config.ts
```

O código está em `tests/integration/firestore-writes.integration.ts`.
O relatório e o identificador do evento para recuperação da limpeza são
salvos em `/tmp/perf-write-<identificador>-*`. Em caso de encerramento forçado,
a limpeza pode não ocorrer e deve usar exclusivamente o evento daquela execução.

### Limites e hospedagem

A medição das gravações cobre a camada transacional real do backend, não as
Server Actions por HTTP, autorização da sessão, câmera ou renderização.
Os tempos incluem a comunicação do executor local com o Firestore remoto.
Os seis cenários são uma verificação curta de concorrência e idempotência,
não uma prova de capacidade sustentada de produção. Avaliações de palestras,
resgate de brindes e sorteios não foram exercitados por essa suíte.

Na primeira tentativa, o preview respondeu com HTTP 302 para
`vercel.com/sso-api`, e nenhuma carga foi enviada. O acesso foi posteriormente
liberado pelo responsável com um bypass de automação; as medições hospedadas
estão nas próximas seções. Para automação, a credencial de bypass
pode ser guardada localmente como `VERCEL_AUTOMATION_BYPASS_SECRET`, sem
ser incluída em commits, logs ou relatórios. O procedimento oficial está em
[Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

## Navegação no preview da Vercel — 9 de setembro de 2026

O bypass de automação permitiu acessar o preview e a sessão sintética foi
aceita pelo Auth.js. O endpoint de QR retornou o identificador exato do perfil
criado em `test_profiles`, confirmando que a aplicação publicada leu a massa
de testes antes do início da carga. O segredo do bypass e os cookies não
foram registrados.

A execução usou 1.020 perfis temporários somados aos 152 existentes,
com etapas de pelo menos 30 segundos. Foram 6.047 requisições medidas sem
falhas HTTP, redirecionamentos ou erros de renderização detectados no HTML.

| Requisições simultâneas | Requisições medidas | Erros | Duração | Mediana | p95    | Máximo  |
| ----------------------- | ------------------- | ----- | ------- | ------- | ------ | ------- |
| 1                       | 59                  | 0     | 30.3 s  | 452 ms  | 859 ms | 1494 ms |
| 10                      | 628                 | 0     | 30.4 s  | 411 ms  | 819 ms | 3021 ms |
| 25                      | 1793                | 0     | 30.5 s  | 377 ms  | 623 ms | 2472 ms |
| 50                      | 3567                | 0     | 30.4 s  | 384 ms  | 601 ms | 2788 ms |

No pico de 50, o p95 geral foi 601 ms. O p95 por rota foi 714 ms para Home,
616 ms para Passaporte, 585 ms para Ranking, 518 ms para Empresas, 528 ms para
Tags e 553 ms para Conexões. Todos os 13.090 documentos temporários foram
removidos. Os números completos estão no
[relatório do preview](./performance-preview-2026-09-09.json).

Para repetir contra um preview de testes explicitamente autorizado:

```bash
node scripts/validate-performance.mjs --apply --stage-seconds=30 --target=https://SEU-PREVIEW.vercel.app
```

O modo remoto requer `VERCEL_AUTOMATION_BYPASS_SECRET` em `.env.local` e um
`AUTH_SECRET` compatível com o preview. O script recusa iniciar a preparação
de dados se a sessão sintética não for aceita. Após a preparação, confirma
que o QR emitido pertence ao perfil temporário antes de iniciar a carga.

Este resultado pertence ao preview informado e à sua configuração no momento
da execução. Não mede o fluxo OAuth do Google, renderização no navegador,
recursos estáticos ou leituras faturadas. Não foram consultados logs internos
da Vercel nem confirmada a revisão Git publicada. A diferença em relação à
medição local não deve ser atribuída somente à hospedagem ou aos índices.

## Server Actions no preview — resultado final

O teste HTTP chama as Server Actions identificadas nos bundles públicos da
versão publicada. Os argumentos, inclusive FormData, são codificados com o
cliente RSC do Next.js. São usadas sessões sintéticas aceitas pelo Auth.js,
Origin correspondente ao preview e QR de participante assinado pelo próprio
servidor. Não há API alternativa nem alteração nas regras de autorização.

### Correção do transporte de medição

As duas primeiras execuções HTTP confirmaram os dados, mas o `fetch` do
executor apresentou processamento sequencial dos POSTs. Seus tempos de
8 a 13 segundos não devem ser usados como evidência de capacidade concorrente
da aplicação. A [primeira execução HTTP](./performance-preview-writes-2026-09-09.json)
foi preservada somente para rastreabilidade.

Uma comparação com 20 ações de entrada inválida, recusadas antes do acesso
ao banco, mediu 3.758 ms no lote com `fetch`, com conclusões praticamente em
sequência, e 936 ms usando conexões HTTPS independentes. O
[controle de transporte](./performance-preview-http-control-2026-09-09.json)
registra os tempos individuais. A observação é específica deste executor;
não identifica a causa interna do comportamento do `fetch`.

O script final usa `node:https` com um pool dedicado de até 50 conexões e
mede separadamente a chegada do resultado da ação e o fim da resposta RSC.
A massa anterior foi removida e toda a verificação foi repetida com novos perfis.

### Resultado com POSTs concorrentes

Foram 156 operações em nove lotes, com até 20 chamadas simultâneas, mais
dois controles de autorização. Todas as respostas e verificações persistidas
corresponderam ao esperado. Recusas por saldo insuficiente são resultados
corretos, não falhas técnicas.

| Cenário                      | Operações | p95 até o resultado | p95 da resposta completa |
| ---------------------------- | --------- | ------------------- | ------------------------ |
| Novas visitas                | 20        | 1477 ms             | 1511 ms                  |
| Visitas repetidas            | 20        | 2341 ms             | 2350 ms                  |
| Novas tags                   | 20        | 803 ms              | 803 ms                   |
| Tags repetidas               | 20        | 839 ms              | 840 ms                   |
| Novas missões                | 20        | 793 ms              | 793 ms                   |
| Missões repetidas            | 20        | 866 ms              | 867 ms                   |
| Conexões nos dois sentidos   | 20        | 1600 ms             | 1784 ms                  |
| Conversões com a mesma chave | 8         | 2544 ms             | 3189 ms                  |
| Conversões disputando saldo  | 8         | 2116 ms             | 2117 ms                  |

Os 20 participantes terminaram com exatamente 180 XP cada, três conclusões
(visita, tag e missão) e uma conexão, mesmo após repetição das atividades.
As conversões preservaram os 500 XP originais dos dois perfis dedicados,
com três tickets no saldo e 400 XP convertidos em cada um. Foram persistidas
somente as duas conversões esperadas. Uma ação sem sessão foi recusada sem
registrar atividade; um token de QR inválido também foi recusado.

Todos os 116 documentos temporários dessa execução foram removidos.
O [relatório final de ações HTTP](./performance-preview-writes-parallel-2026-09-09.json)
contém as distribuições de respostas e as verificações realizadas.

Para repetir:

```bash
node scripts/validate-preview-writes.mjs --target=https://SEU-PREVIEW.vercel.app
node scripts/validate-preview-writes.mjs --apply --target=https://SEU-PREVIEW.vercel.app
```

Sem `--apply`, o script apenas mostra o plano. A execução exige o bypass,
um segredo Auth.js compatível e `DEVMODE=true` em `.env.local`. Usa 22 perfis
temporários e atividades já existentes no catálogo de testes, sem modificar
as definições do catálogo. A missão escolhida deve ser por QR e sem pré-requisitos.
A limpeza restringe-se aos perfis gerados e seus registros relacionados.

## Conclusão da validação

A navegação local e no preview, as transações reais e as Server Actions por
HTTP passaram nos cenários documentados. Em conjunto com as validações manuais
confirmadas pelo responsável, isso encerra o item de desempenho do polimento
para o cenário testado.

Essa conclusão não é uma garantia de capacidade para qualquer pico do evento.
Permanecem como limites: testes curtos, login OAuth sem carga, ausência de
métricas de custo e de observabilidade interna, nenhuma medição de renderização
no navegador e revisão Git do preview não confirmada. Condições de produção,
monitoramento e smoke test após deploy pertencem à preparação de lançamento.
