# Navegação

## Navegação principal

O layout autenticado usa Bottom Navigation com destinos estáveis:

- Home (`/home`);
- Missões (`/missions`);
- Scanner (`/scan`) como ação central;
- Passaporte (`/passport`);
- Perfil (`/profile`).

Empresas, ranking, conexões, palestras, badges e tickets são acessados por atalhos e navegação contextual. Todos os itens principais exibem ícone e texto; o scanner usa um botão central elevado e destacado.

## Acesso às rotas

Rotas públicas:

```text
/
/login
/qr/[eventId]/[type]/[qrId]
```

`/onboarding` exige autenticação, mas antecede o restante da aplicação. As demais páginas funcionais são protegidas.

## Redirecionamentos

```text
sem sessão → /login
com sessão e onboarding incompleto → /onboarding
com sessão e onboarding concluído → /home
usuário autenticado em /login → destino adequado ao perfil
```

Preserve o destino original quando seguro para permitir retorno após o login. Nunca aceite URLs externas ou destinos não autorizados como callback.

## Rotas dinâmicas e deep links

- parâmetros devem ser validados no servidor;
- recurso inexistente ou não autorizado deve retornar `notFound` ou erro apropriado;
- deep links de QR Code passam pela validação do servidor antes de qualquer ação;
- scans exigem conexão e exibem sucesso ou erro após a validação;
- IDs públicos de QR Code não devem expor IDs do Firestore.

## Botão voltar e estado

Use histórico quando houver origem conhecida; caso contrário, forneça destino seguro. Preserve filtros e posição de scroll quando isso melhorar o retorno a listas. Loading e transições não devem permitir ações duplicadas.

## Checklist

- [ ] Estado ativo da navegação está correto.
- [ ] Rotas protegidas validam sessão no servidor.
- [ ] Onboarding incompleto é redirecionado.
- [ ] Parâmetros e callbacks são validados.
- [ ] Deep links não executam ações sem autenticação, autorização e validação.

## Próximo documento

➡️ [Firestore](../backend/01-firestore.md)
