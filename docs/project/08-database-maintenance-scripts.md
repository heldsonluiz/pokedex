# Scripts de reset e seed do Firestore

O projeto possui três scripts administrativos para restaurar um participante,
recriar a massa de testes e preparar o Firestore para o lançamento.

| Comando                | Finalidade                                     | Escopo destrutivo          |
| ---------------------- | ---------------------------------------------- | -------------------------- |
| `db:reset-participant` | restaurar uma conta para repetir o fluxo       | um participante e relações |
| `db:seed`              | apagar o Firestore e recriar a massa de testes | banco inteiro              |
| `db:prepare-launch`    | apagar o Firestore antes do cadastro real      | banco inteiro              |

Os scripts não alteram o Firebase Authentication nem o Firebase Storage. Eles
atuam no Firestore configurado em `.env.local` por padrão. Para usar `.env`,
informe `--production`. O flag `--local` continua disponível explicitamente;
`--local` e `--production` não podem ser combinados. A simulação mostra o arquivo
e o ambiente escolhidos, e seu comando de aplicação preserva essa escolha.
Quando `DEVMODE=true`, eles
consultam, apagam e gravam somente coleções raiz com o prefixo `test_`; as
coleções sem prefixo são preservadas. Os dois comandos de limpeza
integral também esvaziam `public/images/qr` e `artifacts`, pois esses diretórios
podem conter materiais apontando para documentos que deixaram de existir.

Para escolher o ambiente nos comandos com npm:

```bash
npm run db:prepare-launch
npm run db:seed
npm run db:prepare-launch -- --production
npm run db:seed -- --production
npm run db:reset-participant -- --production --email pessoa@exemplo.com
```

## Pré-requisitos

Antes de executar qualquer comando, configure:

```dotenv
EVENT_ID=devfest-triangulo-2026
NEXT_PUBLIC_APP_URL=http://localhost:3001
FB_ADMIN_PROJECT_ID=seu-projeto
FB_ADMIN_CLIENT_EMAIL=firebase-adminsdk@seu-projeto.iam.gserviceaccount.com
FB_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

A conta de serviço precisa ter permissão administrativa no Firestore. Confirme
também que `FB_ADMIN_PROJECT_ID` aponta para o ambiente correto. Os comandos de
banco inteiro não distinguem automaticamente desenvolvimento e produção.

## Modelo de segurança

Todos os comandos executam em modo de simulação quando `--apply` não é
informado. A simulação lê a base, mostra projeto, evento e quantidade de
documentos, mas não faz gravações.

Para aplicar uma operação é obrigatório informar:

1. `--apply`;
2. a frase exata apresentada pelo modo de simulação em `--confirm`.

A confirmação contém o projeto e o evento. No reset individual, contém também
o e-mail. Uma confirmação copiada de outro ambiente não funciona.

> Sempre execute primeiro a simulação, confira os identificadores exibidos e
> copie a confirmação produzida pelo próprio comando.

## Restaurar um participante

Arquivo: `scripts/reset-participant.mjs`.

### Simular

```bash
npm run db:reset-participant -- --email participante@exemplo.com
```

O resultado informa o perfil encontrado, documentos que serão apagados,
conexões que exigem compensação, estoque que será devolvido e simulações de
sorteio que serão descartadas.

### Aplicar

Use o comando completo apresentado pela simulação. O formato é:

```bash
npm run db:reset-participant -- \
  --email "participante@exemplo.com" \
  --apply \
  --confirm "RESET_PARTICIPANT:projeto:evento:participante@exemplo.com"
```

### O que é removido

- perfil do participante;
- resumo individual;
- visitas, tags e missões concluídas;
- avaliações de palestras;
- transações e saldo de tickets armazenado no perfil removido;
- resgates de brindes;
- conexões;
- tentativas, vencedores e referências do participante nos sorteios;
- simulações de sorteio do evento.

### Como a consistência é preservada

- cada conexão aceita removida desconta o XP do outro participante;
- o contador de conexões do outro participante é decrementado;
- unidades de brindes resgatadas são devolvidas ao estoque;
- chunks de sorteio deixam de referenciar o participante;
- um prêmio cujo candidato ou vencedor foi removido volta ao estado pendente;
- simulações são descartadas porque representam uma fotografia imutável da base.

O usuário permanece no Firebase Authentication. Ao entrar novamente com a
mesma conta Google, a aplicação cria um perfil novo e permite repetir
onboarding, configuração e atividades.

O script interrompe sem alterações quando nenhum perfil é encontrado, quando o
e-mail está duplicado no evento ou quando um brinde necessário para reposição
não existe mais.

As exclusões e inserções administrativas são enviadas em lotes de até 400
operações. Isso mantém margem abaixo do limite de 500 operações do Firestore e
evita depender do limitador de taxa do `BulkWriter`.

### Retomar uma execução antiga parcialmente aplicada

Versões anteriores do script podiam falhar no `BulkWriter` depois que a
compensação de conexões e estoque já havia sido confirmada. Somente nesse caso,
repita o comando original acrescentando `--recovery compensated`:

```bash
npm run db:reset-participant -- \
  --email "participante@exemplo.com" \
  --apply \
  --recovery compensated \
  --confirm "RESET_PARTICIPANT:projeto:evento:participante@exemplo.com"
```

Esse modo pula deliberadamente a compensação inicial e conclui a limpeza
restante. Não o utilize em um reset novo: nesse caso, as conexões e o estoque
deixariam de ser compensados.

## Recriar a massa de testes

Arquivos:

- `scripts/reset-and-seed-test-data.mjs`;
- `scripts/fixtures/event-test-data.mjs`.

### Simular

Ambiente local por padrão, usando as variáveis de `.env.local`:

```bash
pnpm db:seed
```

Produção, usando as variáveis de `.env`:

```bash
pnpm db:seed --production
```

### Aplicar

```bash
pnpm db:seed --apply --confirm "RESET_AND_SEED:projeto:evento"
```

Para aplicar em produção, preserve `--production` no comando:

```bash
pnpm db:seed --production --apply --confirm "RESET_AND_SEED:projeto:evento"
```

O script monta e valida a massa em memória antes da primeira exclusão. Depois,
enumera todas as coleções e subcoleções do Firestore, remove seus documentos,
esvazia os materiais locais gerados e grava a nova massa.

### Dados criados

- 150 perfis fictícios com XP, tickets e interesses variados (incluindo perfis sem interesses);
- 450 conexões aceitas distribuídas entre os participantes, com os interesses em comum registrados;
- resumos individuais coerentes com as conexões;
- 8 empresas ativas;
- 22 tags com imagens pixel art;
- 21 missões por QR, reviewer, palavra-chave, quiz ou progresso automático, incluindo networking por interesse e pré-requisitos;
- 6 brindes ativos com custos, estoques e limites variados;
- 6 prêmios de sorteio ativos em estado pendente;
- 26 palestrantes;
- 24 palestras;
- keynote de abertura e keynote de encerramento;
- dois painéis com mais de um palestrante;
- horários e trilhas em `schedule`;
- operações do evento abertas para conversões e resgates.

As imagens ficam em `public/images/test-data`. As URLs persistidas usam
`NEXT_PUBLIC_APP_URL`, portanto essa variável precisa representar a origem em
que os assets serão servidos.

O seed valida a massa antes da limpeza e falha caso alguma fixture tente gravar
em `scheduleSlots`. Em modo local, somente coleções com prefixo `test_` são
apagadas; portanto, uma coleção legada `scheduleSlots` sem esse prefixo pertence
ao ambiente não local e não é removida por `pnpm db:seed --local`. A coleção
local legada `test_scheduleSlots`, quando existente, é encontrada pela limpeza
geral e removida antes da gravação de `test_schedule`.

Empresas, tags e missões formam um catálogo determinístico. Seus IDs de
documento, IDs públicos de QR Code, textos, imagens, ordem, pontuação e regras
permanecem iguais entre execuções do seed. Apenas metadados da nova execução,
como `createdAt` e `updatedAt`, são atualizados. Com isso, os materiais de QR
Code continuam apontando para as mesmas entidades depois de recriar a base.

Os e-mails terminados em `@example.test` são apenas dados do Firestore. Eles não
representam contas Google e não podem autenticar.

### Novas missões para teste

- `palavra-da-comunidade`: aceita **Conexão** ou **Networking**, até 3 tentativas.
- `senha-da-aurora`: aceita **Nuvem** ou **Cloud**, até 2 tentativas, após visitar `aurora-cloud`.
- `primeiro-interesse-em-comum`: meta de 1 pessoa com interesses em comum.
- `tribo-dos-interesses`: meta de 3 pessoas com interesses em comum.
- `quiz-web-relampago`: 3 perguntas, mínimo de 2 acertos e até 3 tentativas; gabarito **HTML, CSS, JavaScript**.
- `quiz-cloud-final`: 2 perguntas, exige todos os acertos e permite 2 tentativas; desbloqueado após `palavra-da-comunidade`. Gabarito: **Adicionar mais instâncias** e **Reduzir o tempo de acesso a dados frequentes**.

Todas as 21 missões usam imagens locais de `public/images/assets/missions`,
incluindo 11 novas ilustrações pixel art em 256×256. Os participantes fictícios
incluem interesses comuns, distintos e vazios. As conexões preservam a
interseção desses interesses, permitindo testar metas alcançadas e pendentes.
Missões por palavra-chave e quiz começam sem tentativas ou conclusões gravadas.
A caça ao tesouro ainda não é incluída porque seu formato não foi implementado.

### Limitação de atomicidade

A limpeza e o seed completo não cabem em uma única transação do Firestore. Se o
processo for interrompido após iniciar as exclusões, a base poderá ficar vazia
ou parcialmente populada. Nesse caso:

1. corrija a causa da interrupção, como cota, conexão ou credencial;
2. execute novamente em modo de simulação;
3. aplique novamente o seed completo.

As exclusões e gravações são divididas em lotes de até 400 operações, mantendo
margem abaixo do limite de 500 operações por lote do Firestore.

## Preparar o Firestore para lançamento

Arquivo: `scripts/prepare-production-database.mjs`.

### Simular

```bash
npm run db:prepare-launch
```

### Aplicar

```bash
npm run db:prepare-launch -- \
  --apply \
  --confirm "PREPARE_LAUNCH:projeto:evento"
```

O script enumera todas as coleções existentes, incluindo coleções desconhecidas
pela versão atual da aplicação, e apaga documentos e subcoleções. Em seguida,
esvazia `public/images/qr` e `artifacts`. O resultado é um Firestore vazio e sem
materiais locais que apontem para os dados antigos, pronto para receber os dados
reais.

Esse comando não cadastra operações iniciais, catálogos ou administradores. Ele
também não remove:

- contas do Firebase Authentication;
- imagens e arquivos do Firebase Storage;
- índices do Firestore;
- regras de segurança;
- configurações do projeto Firebase.

## Ordem recomendada antes do lançamento

1. Faça backup ou exportação dos dados que precisam ser preservados.
2. Execute `db:prepare-launch` sem `--apply`.
3. Confira `projectId`, `eventId`, `documentsToDelete` e
   `generatedFilesToDelete`.
4. Aplique a confirmação exibida.
5. Cadastre os catálogos reais do evento.
6. Entre com as contas da organização e configure suas `accessRoles`.
7. Faça um teste controlado de login, QR Code e operação.

## Manutenção dos scripts

A autenticação, leitura de `.env.local`, confirmação, plano de limpeza e
operações em lote ficam centralizadas em
`scripts/lib/firestore-admin.mjs`. A massa de catálogos fica separada em
`scripts/fixtures/event-test-data.mjs` para que quantidades, descrições e assets
possam evoluir sem misturar infraestrutura destrutiva com dados fictícios.

Sempre que uma nova relação entre coleções for criada, revise primeiro o reset
individual. Uma exclusão simples pode deixar XP, estoque, contadores ou
fotografias de sorteio inconsistentes.
