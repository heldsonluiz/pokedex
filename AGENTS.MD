# Project Instructions

## Escopo

O DevFest Triângulo Pokedex é uma aplicação mobile first para participantes do evento. Cada implantação atende uma edição, mas a base deve ser reutilizável em edições futuras.

O produto inclui autenticação com Google, perfil, onboarding, networking por QR Code, empresas, missões, passaporte, palestras, XP, níveis, ranking, badges e tickets por nível para sorteios.

O painel administrativo já existe em outro projeto e está fora deste repositório. Não implemente gestão administrativa, cadastro de conteúdo ou relatórios administrativos aqui, salvo uma integração explicitamente solicitada.

## Stack

- Next.js 16+ com App Router e React 19+;
- TypeScript strict;
- Tailwind CSS v4 e Shadcn/UI;
- Auth.js com Google OAuth;
- Firebase Admin, Cloud Firestore e Firebase Storage;
- React Hook Form e Zod;
- pnpm.

Versões exatas pertencem ao `package.json` e ao lockfile.

## Arquitetura

Utilize Server Components por padrão e mantenha a menor fronteira de cliente possível. Use `"use client"` somente para estado, eventos, câmera, APIs do navegador ou bibliotecas incompatíveis com o servidor.

```text
UI → Server Action/Route Handler → Service → Repository → Firestore
```

- páginas e componentes coordenam apresentação e interação;
- Actions e Handlers validam entrada, sessão e contrato de transporte;
- Services aplicam autorização e regras de negócio;
- Repositories executam consultas, transações e persistência;
- utilize a estrutura do App Router diretamente na raiz; não crie o diretório `src/`;
- regras de negócio ficam em `modules`;
- infraestrutura e integrações ficam em `lib`;
- primitivas Shadcn ficam em `components/ui`;
- arquivos gerados em `components/ui` não devem ser alterados por ESLint ou Prettier;
- componentes não acessam o Firestore diretamente;
- Firebase Admin é exclusivo do servidor e deve ser protegido com `server-only`.

## Código

- Não utilize `any`; trate entradas desconhecidas como `unknown` e refine-as.
- Valide entradas externas com Zod, inclusive no servidor.
- Utilize imports absolutos com `@/`.
- Utilize arquivos e pastas em `kebab-case`.
- Utilize Conventional Commits em inglês.
- Não altere arquivos fora do escopo solicitado.
- Preserve alterações existentes e não relacionadas.
- Não registre tokens, credenciais, sessões ou dados pessoais desnecessários.

## Segurança e integridade

- Nunca confie em dados enviados pelo cliente.
- Autenticação não substitui autorização; valide permissão por operação e recurso.
- XP, níveis, `xpReachedAt`, badges, scans, conexões e tickets são controlados pelo servidor.
- Operações repetíveis devem ser idempotentes.
- Use transações ou operações atômicas quando houver concorrência.
- IDs internos do Firestore não podem aparecer em QR Codes.
- O e-mail não é público; pode ser compartilhado somente entre conexões aceitas.
- Dados do evento são mantidos por até dois anos e depois devem ser excluídos ou anonimizados conforme a política definida.
- Firestore Rules continuam obrigatórias mesmo quando o acesso ocorre por código de servidor.

## Regras de domínio

### QR Codes

- Formato: `/qr/{eventId}/{type}/{qrId}`.
- Tipos: `user`, `company`, `mission` e `tag`.
- Scans exigem conexão e validação no servidor.
- O QR Code do participante expira após um minuto.
- QR Codes de empresas, missões automáticas e tags são fixos e controlados pelo estado da entidade.
- Palestras não possuem QR Code; a avaliação é liberada pelo horário de encerramento configurado.
- Abrir diretamente um deep link não deve ignorar autenticação, autorização ou validação.

### Networking

```text
scan → conexão automática → concessão de XP
```

- uma conexão concede XP aos dois participantes uma única vez;
- o participante pode remover uma conexão;
- a remoção revoga a XP concedida, mas preserva o histórico;
- criação, concessão e revogação devem ser atômicas e idempotentes.

### Empresas

- cada empresa possui somente um QR Code ativo;
- QR Codes adicionais no estande pertencem a missões associadas à empresa;
- a primeira visita concede XP e um carimbo; novas leituras retornam o estado existente;
- visitas e seus carimbos são permanentes e não possuem fluxo de remoção;
- visita, XP e carimbo são registrados atomicamente e de forma idempotente.

### XP, ranking, badges e tickets

- XP não é moeda e não pode ser gasto;
- níveis usam faixas fixas;
- o ranking é geral e ordenado por XP;
- em empate, fica à frente quem atingiu primeiro a pontuação atual, usando `xpReachedAt`;
- badges são conquistas visuais e não concedem XP;
- cada nível concede no máximo um ticket por participante;
- tickets devem ser concedidos de forma idempotente.

### Missões e palestras

- missões podem ser validadas automaticamente por QR Code ou submetidas a revisores;
- qualquer usuário com papel de reviewer pode validar uma missão que exija revisão;
- missões podem exigir visitas ou outras conclusões como pré-requisitos;
- avaliações de palestra são liberadas após o horário de encerramento, sem QR Code de presença;
- enviar uma avaliação válida conclui sua missão e concede XP uma única vez;
- avaliações são vinculadas ao perfil do avaliador.

## Decisões pendentes

Consulte `docs/project-questionnaire.md`. Não invente regras marcadas como `A definir`, especialmente valores de XP, faixas dos níveis, tipos e critérios das missões, badges, sorteios, avaliações e métricas.

Se uma tarefa depender de uma dessas decisões, solicite definição antes de implementar o comportamento.

## Documentação

Sempre consulte:

- `docs/project/01-project-overview.md`;
- `docs/project/03-project-architecture.md`;
- `docs/project/04-code-standards.md`.

Consulte conforme a tarefa:

- dados: `docs/backend/01-firestore.md`;
- autenticação: `docs/backend/02-authentication.md`;
- QR Code: `docs/backend/03-qr-code.md`;
- segurança: `docs/backend/04-security.md`;
- permissões: `docs/backend/05-firestore-rules.md`;
- operações de servidor: `docs/backend/06-server-actions.md`;
- componentes e páginas: `docs/frontend/02-components.md` e `docs/frontend/03-pages.md`;
- navegação: `docs/frontend/04-navigation.md`;
- prioridades: `docs/project/06-roadmap.md`.

Atualize a documentação quando alterar arquitetura, schema, regras, rotas, contratos, ambiente ou comportamento do produto.

## Validação

- Para código ou configuração, execute `pnpm check`.
- Antes de concluir uma funcionalidade, execute também `pnpm build`.
- Para alterações apenas em Markdown, valide Prettier, links locais e `git diff --check`.
- Teste Firestore Rules com o Emulator Suite quando forem alteradas.
- Teste câmera e scanner em dispositivo real quando possível.
