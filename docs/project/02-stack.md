# Stack

Este documento registra as tecnologias aprovadas e suas responsabilidades. Versões exatas pertencem ao `package.json` e ao lockfile.

## Aplicação

| Tecnologia        | Responsabilidade                                               |
| ----------------- | -------------------------------------------------------------- |
| Next.js 16+       | App Router, Server Components, Server Actions e Route Handlers |
| React 19+         | composição da interface                                        |
| TypeScript strict | tipagem estática                                               |
| Tailwind CSS v4   | estilos e tokens visuais                                       |
| Shadcn/UI         | componentes básicos acessíveis e customizáveis                 |

Server Components são o padrão. Client Components devem existir somente quando houver estado, eventos, APIs do navegador ou hooks de cliente.

## Dados e autenticação

| Tecnologia       | Responsabilidade                       |
| ---------------- | -------------------------------------- |
| Auth.js          | login com Google e sessão da aplicação |
| Cloud Firestore  | persistência principal                 |
| Firebase Admin   | operações privilegiadas no servidor    |
| Firebase Storage | imagens e arquivos quando necessários  |

O Firebase Admin nunca deve ser importado no cliente. Componentes não acessam o Firestore diretamente; o acesso passa pelos módulos da aplicação.

## Formulários e validação

| Tecnologia      | Responsabilidade                                    |
| --------------- | --------------------------------------------------- |
| React Hook Form | estado e interação de formulários complexos         |
| Zod             | validação de entradas externas e derivação de tipos |

Dados de formulários, rotas, Server Actions, QR Codes e variáveis de ambiente devem ser validados na fronteira do sistema.

## Ferramentas

- `pnpm`: dependências e scripts;
- ESLint: qualidade estática;
- Prettier: formatação e ordenação de classes Tailwind;
- Husky e lint-staged: validação de arquivos staged;
- Commitlint: Conventional Commits;
- Vitest: testes automatizados de contratos e regras de domínio;
- Lucide React: ícones.

O scanner usa `@zxing/browser` para controlar a câmera e decodificar QR Codes
continuamente no navegador. A biblioteca foi escolhida por oferecer API em
TypeScript, seleção da câmera traseira por constraints e encerramento explícito
do stream. Ela é carregada dinamicamente somente quando o participante ativa a
câmera, evitando incluí-la no carregamento inicial das páginas autenticadas.

O build de produção usa `next build --webpack`. O Turbopack permaneceu bloqueado
na otimização sem apresentar erro neste projeto, enquanto o mesmo código
concluiu compilação, tipagem, geração de páginas e coleta de traces com Webpack.
O servidor de desenvolvimento continua usando `next dev`.

## Critérios para novas dependências

Antes de adicionar uma biblioteca, confirme que:

- resolve uma necessidade real não atendida pela stack atual;
- possui manutenção ativa, tipos adequados e tamanho aceitável;
- funciona com React Server Components quando aplicável;
- não duplica uma dependência existente.

## Próximo documento

➡️ [Arquitetura do projeto](./03-project-architecture.md)
