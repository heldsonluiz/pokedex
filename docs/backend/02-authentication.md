# Autenticação

O projeto utiliza Auth.js com Google OAuth como único método de login.

## Fluxo

```text
Google OAuth → Auth.js → sessão → localizar/criar profile
→ onboarding incompleto ou home
```

Não há cadastro manual, senha ou recuperação de senha.

## Sessão e perfil

A sessão identifica o usuário com `id`, `name`, `email` e `image`. Dados de domínio são carregados da coleção `profiles`.

No primeiro acesso, o servidor cria o profile de forma idempotente. A conclusão do onboarding determina o destino após autenticação.

## Rotas

- `/` e `/login` são públicas;
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

- [ ] Login e logout funcionam.
- [ ] Criação do profile é idempotente.
- [ ] Rotas e callbacks são protegidos.
- [ ] Onboarding direciona corretamente.
- [ ] Operações validam autorização além da sessão.

## Próximo documento

➡️ [QR Code](./03-qr-code.md)
