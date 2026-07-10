# Arquitetura do projeto

## Princípios

- Server Components por padrão;
- regras de negócio independentes da interface;
- entradas externas validadas com Zod;
- acesso a dados encapsulado;
- dependências direcionadas da interface para o domínio e a infraestrutura;
- separação explícita entre código de servidor e de cliente.

## Estrutura

O projeto utiliza a estrutura do App Router diretamente na raiz. Não crie o diretório `src/`.

```text
app/          # rotas, layouts, páginas e handlers
components/   # componentes compartilhados e UI
modules/      # regras e tipos de cada domínio
lib/          # integrações e infraestrutura
hooks/        # hooks reutilizáveis de cliente
providers/    # providers React
config/       # configuração estática
data/         # dados estáticos
utils/        # funções genéricas e puras
types/        # tipos realmente compartilhados
env.ts        # ambiente validado
```

Crie os diretórios conforme a implementação exigir; não é necessário manter pastas vazias. O alias `@/*` aponta para a raiz, portanto `@/modules/profile` resolve para `modules/profile`.

## Responsabilidades

### `app`

Declara rotas, layouts, metadata, estados de loading/erro e Route Handlers. Páginas devem coordenar carregamento e composição, não concentrar regras de negócio.

Route Groups podem separar fluxos como `(auth)`, `(onboarding)` e `(app)` sem alterar URLs.

### `components`

- `components/ui`: componentes Shadcn e primitivas visuais;
- demais pastas: componentes compartilhados por contexto.

Componentes recebem dados e callbacks por props. Componentes específicos de uma funcionalidade podem permanecer no módulo correspondente.

### `modules`

Cada domínio, como `profile`, `missions` ou `qr-code`, concentra schemas, serviços, repositórios, tipos e regras. Uma estrutura típica é:

```text
modules/profile/
├── profile.schema.ts
├── profile.service.ts
├── profile.repository.ts
├── profile.types.ts
└── profile.constants.ts
```

Crie somente os arquivos necessários; módulos pequenos não precisam reproduzir toda a estrutura.

### `lib`, `utils` e `data`

- `lib`: clientes e adaptadores de Auth.js, Firebase e serviços externos;
- `utils`: funções puras, genéricas e sem conhecimento do domínio;
- `data`: listas estáticas sem regra de negócio.

## Fluxo de dependências

```text
app/components → modules → lib
                    ↓
              Firestore/Auth.js
```

Evite dependências de `modules` para páginas ou componentes, lógica de negócio em `app` e acesso ao Firestore em componentes.

## Servidor e cliente

Use Client Components apenas para interação, estado local, câmera, APIs do navegador ou bibliotecas incompatíveis com o servidor. Mantenha a menor fronteira de cliente possível.

Arquivos exclusivos do servidor devem usar `server-only` ou uma convenção explícita como `*.server.ts`. Firebase Admin, segredos e operações críticas permanecem no servidor.

## Operações

- **Server Actions:** mutações iniciadas pela interface.
- **Route Handlers:** webhooks, integrações, endpoints públicos e validação do scanner.
- **Services:** regras de negócio e autorização.
- **Repositories:** consultas e persistência.

Fluxo recomendado:

```text
UI → Action/Handler → Service → Repository → Firestore
```

Toda operação deve validar entrada e sessão antes de alterar estado. Erros esperados devem retornar códigos estáveis; erros inesperados devem ser registrados sem expor dados sensíveis.

## Estado, cache e imports

- prefira estado local e dados vindos do servidor;
- introduza estado global apenas quando múltiplas áreas independentes precisarem do mesmo estado de cliente;
- aplique cache somente a dados públicos ou estáveis;
- revalide dados após mutações;
- utilize imports absolutos com `@/`;
- evite barrels que criem ciclos ou misturem código de servidor e cliente.

## Checklist arquitetural

- [ ] A regra está no módulo correto.
- [ ] A entrada foi validada.
- [ ] Autenticação e autorização ocorrem no servidor.
- [ ] Componentes não acessam o Firestore.
- [ ] Segredos não atravessam a fronteira do cliente.
- [ ] Loading, vazio e erro foram considerados.

## Próximo documento

➡️ [Padrões de código](./04-code-standards.md)
