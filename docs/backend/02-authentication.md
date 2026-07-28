# Autenticação

O projeto utiliza Auth.js v5 com Google OAuth como único método de login.

## Integração com Next.js

A configuração principal fica em `lib/auth.ts` e exporta `auth`, `handlers`, `signIn` e `signOut`. O Route Handler em `app/api/auth/[...nextauth]/route.ts` reexporta `GET` e `POST` a partir de `handlers`.

A aplicação utiliza sessões JWT sem adapter de usuários do Auth.js. No login Google, o callback JWT substitui o `token.sub` pelo `account.providerAccountId`, que corresponde ao identificador estável da conta no provedor. O callback de sessão disponibiliza esse valor como `session.user.id`, permitindo associar a identidade autenticada ao perfil sem usar o e-mail como chave. O UUID temporário gerado pelo Auth.js para `user.id` não deve ser usado como chave de domínio.

No Next.js 16, `proxy.ts` protege antecipadamente as rotas configuradas e preserva o destino original. O layout do grupo `(app)` também valida a sessão no servidor por meio de `requireAuth()`. O proxy coordena navegação, mas não substitui a validação de sessão e autorização nas operações sensíveis.

Login e logout são executados pelas Server Actions de `modules/auth/auth.actions.ts`. Destinos recebidos por formulário são validados e convertidos em caminhos internos permitidos antes do redirecionamento.

A página `/login` trata separadamente erros OAuth esperados, falhas inesperadas de renderização, carregamento e estado pendente das ações.

As credenciais `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` seguem a inferência de ambiente do Auth.js. A versão exata da dependência continua definida por `package.json` e `pnpm-lock.yaml`.

## Fluxo

```text
Google OAuth → Auth.js → sessão → localizar/criar profile
→ onboarding incompleto ou home
```

Não há cadastro manual, senha ou recuperação de senha.

Após o retorno do provedor, `/auth/complete` valida a sessão e garante a existência do documento de perfil antes de encaminhar o participante ao destino seguro.

## Sessão e perfil

A sessão identifica o usuário com `id`, `name`, `email` e `image`. Dados de domínio são carregados da coleção `profiles`.

No primeiro acesso, o servidor cria o profile de forma idempotente. A conclusão do onboarding determina o destino após autenticação.

## Rotas

- `/` e `/login` são públicas;
- `/profile` exige sessão e carrega o perfil persistido;
- `/onboarding` exige sessão;
- páginas funcionais exigem sessão e onboarding concluído;
- `/qr/...` pode ser aberto sem sessão, mas qualquer ação exige autenticação e validação.

Redirecionamentos devem ocorrer no servidor sempre que possível e aceitar apenas callbacks internos seguros.

## Autorização

Auth.js comprova identidade, não permissão. Cada operação deve verificar se o usuário pode acessar ou alterar o recurso. Participantes podem editar apenas campos permitidos do próprio perfil e não podem alterar XP, badges, scans, tickets ou dados administrativos.

Administradores e revisores de missão são definidos pela organização. Neste projeto, esses papéis servem apenas para autorizar operações integradas ou fluxos de revisão previstos; a gestão administrativa completa permanece no painel externo.

## Segurança

- valide a sessão no servidor;
- use Firebase Admin somente em código de servidor;
- não exponha tokens, segredos ou e-mail em dados públicos;
- limpe estado sensível ao encerrar a sessão;
- registre falhas sem armazenar credenciais ou tokens.

## Checklist

### Fase 3 — Autenticação

- [x] Login e logout funcionam.
- [x] Sessão JWT identifica o participante com `id`, `name`, `email` e `image`.
- [x] Rotas privadas validam a sessão no proxy e no servidor.
- [x] Callbacks aceitam apenas destinos internos permitidos.
- [x] Loading, erros esperados, falhas inesperadas e ações pendentes são tratados.

### Integrações

- [x] Criação do profile é idempotente na Fase 4.
- [ ] Onboarding direciona corretamente na Fase 5.
- [ ] Operações de domínio validam autorização além da sessão nas fases correspondentes.

## Próximo documento

➡️ [QR Code](./03-qr-code.md)
