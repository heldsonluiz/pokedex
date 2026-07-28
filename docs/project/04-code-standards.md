# Padrões de código

## Convenções

| Elemento              | Padrão             | Exemplo              |
| --------------------- | ------------------ | -------------------- |
| arquivos e pastas     | `kebab-case`       | `profile-form.tsx`   |
| componentes e tipos   | `PascalCase`       | `ProfileForm`        |
| funções e variáveis   | `camelCase`        | `updateProfile`      |
| constantes de domínio | `UPPER_SNAKE_CASE` | `MAX_PROFILE_SKILLS` |
| hooks                 | prefixo `use`      | `useQrScanner`       |
| handlers internos     | prefixo `handle`   | `handleSubmit`       |
| props de callback     | prefixo `on`       | `onSelect`           |

Booleanos devem expressar condições (`isLoading`, `hasProfile`, `canEdit`). Exceções de nome de arquivo incluem `README.md`, `CHANGELOG.md` e `AGENTS.md`.

## TypeScript

- mantenha `strict` habilitado;
- não use `any`; receba dados desconhecidos como `unknown` e refine-os;
- prefira inferência quando o tipo estiver evidente;
- derive tipos de schemas Zod quando eles forem a fonte do contrato;
- use `import type` para imports exclusivamente de tipos;
- modele estados finitos com unions em vez de strings genéricas;
- evite prefixos como `IProfile` e `TProfile`.

## React

- use Server Components por padrão;
- mantenha Client Components pequenos e próximos da interação que os exige;
- prefira componentes nomeados, props explícitas e early returns;
- não armazene em estado valores que podem ser derivados durante a renderização;
- use `useEffect` apenas para sincronização com sistemas externos;
- utilize chaves estáveis em listas, nunca o índice quando a ordem puder mudar;
- componha componentes em vez de criar props excessivamente condicionais.

## Imports e organização

Ordem automatizada:

1. efeitos colaterais;
2. pacotes externos;
3. imports absolutos com `@/`;
4. imports relativos;
5. estilos.

Evite caminhos relativos longos e barrels que escondam dependências ou misturem módulos de servidor e cliente.

## Estilos

- desenvolva mobile first;
- utilize tokens semânticos em vez de cores diretas;
- use `cn()` para classes condicionais;
- deixe o Prettier ordenar classes Tailwind;
- limite valores arbitrários a casos que não pertençam ao Design System;
- reutilize ou estenda componentes de `components/ui` antes de criar novas primitivas.

Os arquivos em `components/ui` são gerados e mantidos pelo Shadcn/UI. Essa pasta é ignorada pelo ESLint e pelo Prettier para preservar o código produzido pela dependência. Adaptações específicas devem ser feitas por composição ou, quando uma alteração direta for indispensável, de forma deliberada e revisada.

## Formulários e validação

- defina o schema Zod antes do formulário;
- use React Hook Form em formulários com validação ou estado relevante;
- valide novamente no servidor, mesmo que haja validação no cliente;
- normalize strings no schema quando fizer parte do contrato;
- apresente erros de campo e bloqueie envios duplicados;
- use `Controller` apenas para componentes sem integração direta com inputs nativos.

## Erros e logs

- trate falhas esperadas com códigos e mensagens apropriadas;
- registre falhas inesperadas no servidor e retorne mensagem genérica ao usuário;
- não registre tokens, sessões, chaves ou dados pessoais desnecessários;
- comentários devem explicar decisões, não repetir o código;
- TODOs precisam indicar uma ação concreta.

## Commits e branches

Branches seguem `tipo/descricao-curta`, por exemplo `feat/profile-form`.

Commits usam Conventional Commits em inglês, com o formato:

```text
tipo(escopo): descrição curta no imperativo
```

Exemplos:

```text
feat(profile): add skill selector
fix(auth): prevent redirect loop
docs(firestore): clarify scan model
```

Tipos aceitos: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `build`, `ci`, `perf` e `revert`.

O escopo identifica a área principal afetada, como `auth`, `onboarding`, `profile` ou `missions`. A descrição deve ser curta, objetiva, escrita no imperativo, iniciada com letra minúscula e não deve terminar com ponto.

Cada commit deve representar uma alteração coesa. Não inclua formatação ou refatorações sem relação com a tarefa. Quando uma mudança exigir contexto adicional, use o corpo do commit para explicar a motivação e o impacto, sem repetir o diff.

## Pull requests

O título do pull request segue o mesmo formato de Conventional Commits usado no commit principal.

A descrição deve explicar o resultado entregue, as mudanças relevantes e como revisar o comportamento. Use a seguinte estrutura:

```markdown
## Resumo

Explique brevemente o objetivo e o resultado da alteração.

## Alterações

- liste as principais mudanças;
- descreva comportamentos, não apenas arquivos;
- mencione contratos, rotas ou persistência afetados.

## Como testar

1. descreva o estado inicial;
2. informe as ações necessárias;
3. indique o resultado esperado.

## Validações executadas

- TypeScript
- ESLint
- Prettier
- testes automatizados ou manuais aplicáveis
```

Quando forem relevantes, acrescente as seções `Decisões técnicas`, `Evidências visuais` e `Observações`. Decisões técnicas registram escolhas que não sejam evidentes pelo código; evidências visuais mostram alterações de interface; observações registram limitações, dependências ou trabalhos futuros.

## Validação

Durante o desenvolvimento:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Antes de concluir:

```bash
pnpm check
pnpm build
```

O repositório usa ESLint, Prettier, Vitest, lint-staged, Husky e Commitlint. `pnpm check` executa tipos, lint, testes e formatação. As configurações reais desses arquivos são a fonte de verdade; não devem ser duplicadas aqui.

## Checklist

- [ ] Código tipado e sem `any`.
- [ ] Entradas externas validadas.
- [ ] Regras de negócio fora da interface.
- [ ] Estados de loading, vazio, erro e sucesso tratados.
- [ ] Sem logs temporários ou dados sensíveis.
- [ ] `pnpm check` e `pnpm build` aprovados.

## Próximo documento

➡️ [Variáveis de ambiente](./05-environment.md)
