# Navegação

## Navegação principal

O layout autenticado usa Bottom Navigation com destinos estáveis:

- Home (`/home`);
- Missões (`/missions`);
- Scanner (`/scan`) como ação central;
- Passaporte (`/passport`);
- Perfil (`/profile`).

Empresas, ranking, conexões, palestras, badges e tickets são acessados por atalhos e navegação contextual. Todos os itens principais exibem ícone e texto; o scanner usa um botão central elevado e destacado.

O layout autenticado mantém os controles de navegação fora da área rolável. Home, Missões, Scanner, Passaporte e Perfil não exibem header; elas usam somente a navegação inferior, com o item atual identificado visualmente e por `aria-current`. Telas secundárias, como edição de perfil e exibição do QR Code, ocultam a navegação inferior e exibem header com retorno explícito para `/profile`.

O scanner usa o tema dark; as demais rotas principais usam o tema light. Telas secundárias podem escolher o tema adequado ao próprio fluxo sem criar outro shell.

## Acesso às rotas

Rotas públicas:

```text
/
/login
/qr/[eventId]/[type]/[qrId]
```

`/onboarding` e `/onboarding/profile` exigem autenticação, mas antecedem o restante da aplicação. A raiz redireciona para `/login`, que mantém sua estrutura visual enquanto verifica a sessão por no mínimo dois segundos. As demais páginas funcionais são protegidas.

## Redirecionamentos

```text
sem sessão → /login
com sessão e onboarding incompleto → /onboarding
com sessão e onboarding concluído → /home
usuário autenticado em /login → destino adequado ao perfil
```

O callback do Google garante a existência do perfil antes de decidir o destino. O layout de onboarding impede que perfis concluídos retornem ao fluxo, e o layout da aplicação impede que perfis incompletos acessem páginas funcionais diretamente.

Preserve o destino original quando seguro para permitir retorno após o login. Nunca aceite URLs externas ou destinos não autorizados como callback.

## Rotas dinâmicas e deep links

- parâmetros devem ser validados no servidor;
- recurso inexistente ou não autorizado deve retornar `notFound` ou erro apropriado;
- deep links de QR Code passam pela validação do servidor antes de qualquer ação;
- scans exigem conexão e exibem sucesso ou erro após a validação;
- IDs públicos de QR Code não devem expor IDs do Firestore.

## Botão voltar e estado

Use histórico quando houver origem conhecida; caso contrário, forneça destino seguro. Preserve filtros e posição de scroll quando isso melhorar o retorno a listas. Loading e transições não devem permitir ações duplicadas.

Telas compartilhadas podem receber uma origem enumerada para definir o retorno contextual. `/profile/qr-code` aceita somente `source=home`; esse valor retorna para `/home`, enquanto qualquer valor ausente ou desconhecido mantém `/profile` como destino seguro. Não use URLs arbitrárias recebidas por query string como destino de retorno.

O documento usa `viewport-fit=cover` para que navegadores móveis exponham corretamente as safe areas. O header considera a safe area superior, e a navegação inferior soma a safe area inferior ao espaçamento visual do componente. Somente o conteúdo central deve rolar, preservando os controles principais em telas pequenas.

## Checklist

- [x] Estado ativo da navegação está correto.
- [x] Rotas protegidas validam sessão no servidor.
- [x] Onboarding incompleto é redirecionado.
- [ ] Parâmetros e callbacks são validados.
- [ ] Deep links não executam ações sem autenticação, autorização e validação.

## Próximo documento

➡️ [Firestore](../backend/01-firestore.md)
