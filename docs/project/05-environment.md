# Variáveis de ambiente

Variáveis devem ser validadas e acessadas por `env.ts`, na raiz. O arquivo `.env.example` é a lista oficial de chaves necessárias; valores reais ficam em `.env.local` e na plataforma de deploy.

## Variáveis privadas

Disponíveis somente no servidor:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
EVENT_ID=
QR_SIGNING_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Podem ser usadas em Server Components, Server Actions, Route Handlers e integrações de servidor. Nunca use o prefixo `NEXT_PUBLIC_` em segredos.

## Variáveis públicas

Enviadas ao navegador e, portanto, sem conteúdo secreto:

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

As chaves públicas do Firebase identificam o projeto, mas não substituem autenticação, autorização ou Firestore Rules.

## Validação e uso

Use `@t3-oss/env-nextjs` com Zod em `env.ts`. Declare separadamente variáveis de servidor e cliente e habilite `emptyStringAsUndefined`.

```ts
import { env } from "@/env"

const projectId = env.FIREBASE_PROJECT_ID
```

Evite acessar `process.env` fora do módulo central. Arquivos de Firebase Admin devem importar `server-only` e normalizar quebras de linha da chave privada quando necessário.

## Auth.js

O login Google utiliza Auth.js v5 e requer `AUTH_SECRET`, `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`. O prefixo `AUTH_` permite que o Auth.js reconheça automaticamente as credenciais do provider Google, portanto elas não precisam ser repassadas manualmente na configuração.

Na v5, o host normalmente é inferido dos headers da requisição e uma URL privada de autenticação não é obrigatória. `AUTH_URL` deve ser adicionada apenas quando a aplicação utilizar um base path personalizado. `NEXT_PUBLIC_APP_URL` permanece separado para usos no navegador e não contém segredos.

URLs de callback seguem:

```text
http://localhost:3000/api/auth/callback/google
https://seu-dominio.com/api/auth/callback/google
```

Gere um secret forte com:

```bash
pnpm exec auth secret
```

Em ambientes atrás de proxy reverso, avalie `AUTH_TRUST_HOST=true`. Vercel e Cloudflare Pages são detectados automaticamente pelo Auth.js; não habilite confiança em headers de host sem conhecer a infraestrutura.

## Evento da implantação

Cada implantação atende uma única edição e define seu evento por `EVENT_ID`. Esse valor é o identificador estável da edição dentro da aplicação e associa perfis e demais documentos ao evento correto.

Exemplo:

```env
EVENT_ID=devfest-triangulo-2026
```

O valor:

- não é um segredo;
- deve ser estável e não deve mudar depois que dados forem criados;
- deve usar um identificador legível, sem espaços e em `kebab-case`;
- deve ser diferente entre edições, como `devfest-triangulo-2026` e `devfest-triangulo-2027`;
- deve ser igual em todas as instâncias de uma mesma implantação.

O servidor usa `EVENT_ID` ao criar perfis e demais documentos vinculados ao evento. A aplicação não infere o evento consultando `isActive`, evitando comportamento ambíguo quando não houver exatamente um evento ativo.

## Assinatura de QR Codes

`QR_SIGNING_SECRET` assina tokens temporários de QR Code com HMAC-SHA-256 e deve possuir pelo menos 32 caracteres aleatórios. Use um valor exclusivo, diferente de `AUTH_SECRET`, e configure o mesmo segredo em todas as instâncias de uma implantação. A rotação invalida imediatamente tokens emitidos com o valor anterior.

Gere um valor seguro com OpenSSL:

```bash
openssl rand -base64 48
```

O comando imprime uma sequência aleatória em Base64. Copie somente o valor gerado para o `.env.local`:

```env
QR_SIGNING_SECRET=valor-gerado-pelo-openssl
```

Em staging e produção, configure o valor diretamente no gerenciador de variáveis da plataforma de deploy. Gere um segredo diferente para cada ambiente. Não coloque o valor real em `.env.example`, documentação, commits, logs ou mensagens.

## Ambientes

Desenvolvimento, staging e produção devem usar projetos ou configurações isoladas. Não reutilize credenciais de produção localmente. Ao adicionar uma variável:

1. inclua-a em `.env.example` sem valor sensível;
2. valide-a em `env.ts`;
3. configure-a em cada ambiente de deploy;
4. documente seu propósito se o nome não for autoexplicativo.

## Segurança

- não versione `.env.local` ou credenciais;
- não exponha variáveis privadas em mensagens de erro ou logs;
- mantenha chaves privadas apenas no servidor;
- rotacione imediatamente qualquer segredo exposto;
- revise variáveis antes de cada deploy.

## Próximo documento

➡️ [Roadmap](./06-roadmap.md)
