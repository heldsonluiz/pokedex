# DevFest Triângulo DevDex

Aplicação web desenvolvida para gamificação do DevFest Triângulo.

O objetivo é incentivar a interação entre participantes, patrocinadores e palestrantes através de missões, QR Codes, networking e recompensas durante o evento.

## Stack

- Next.js 16+
- React 19+
- TypeScript
- Tailwind CSS v4
- Shadcn/UI
- Auth.js (Google)
- Firebase / Firestore
- React Hook Form
- Zod

## Estrutura

```text
app/          # Rotas e páginas do App Router
components/   # Componentes reutilizáveis e Shadcn/UI
modules/      # Regras de negócio, criado conforme necessário
lib/          # Infraestrutura e utilitários compartilhados
docs/         # Documentação funcional e técnica
env.ts        # Variáveis de ambiente validadas
```

O projeto utiliza a estrutura do App Router diretamente na raiz e não utiliza o diretório `src/`.

## Primeiros passos

Instale as dependências:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

## Scripts

Executar em modo de desenvolvimento:

```bash
pnpm dev
```

Gerar build de produção:

```bash
pnpm build
```

Executar a aplicação em produção:

```bash
pnpm start
```

Executar o ESLint:

```bash
pnpm lint
```

Corrigir automaticamente problemas do ESLint:

```bash
pnpm lint:fix
```

Formatar todo o projeto:

```bash
pnpm format
```

Verificar formatação:

```bash
pnpm format:check
```

Executar todas as validações:

```bash
pnpm check
```

## Convenções

- **Arquivos:** `kebab-case`
- **Componentes:** `PascalCase`
- **Funções e variáveis:** `camelCase`
- **Constantes:** `UPPER_SNAKE_CASE`
- **Imports:** organizados automaticamente pelo ESLint
- **Commits:** Conventional Commits

Exemplos:

```text
feat(profile): add skill selector
fix(auth): prevent redirect loop
refactor(qr-code): extract parser
```

## Funcionalidades

- Login com Google
- Onboarding
- Perfil do participante
- Passaporte digital
- Sistema de missões
- Leitor de QR Code
- Networking
- Ranking
- Badges
- Premiações
- Avaliação de palestras

## Licença

Este projeto foi desenvolvido para o evento DevFest Triângulo.
