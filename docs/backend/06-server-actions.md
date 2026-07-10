# Server Actions e Route Handlers

## Quando usar

- **Server Actions:** mutações iniciadas pela própria interface, como salvar perfil, concluir onboarding, aceitar ou remover conexão.
- **Route Handlers:** scanner, webhooks, integrações externas e endpoints que precisam de contrato HTTP.
- **Firebase Admin:** leitura ou escrita privilegiada exclusivamente no servidor.

## Fluxo

```text
UI → Action/Handler → Service → Repository → Firestore
```

| Camada         | Responsabilidade                                       |
| -------------- | ------------------------------------------------------ |
| Action/Handler | validar entrada, sessão, rate limit e adaptar resposta |
| Service        | autorização e regras de negócio                        |
| Repository     | consultas, transações e persistência                   |

Uma estrutura possível é:

```text
modules/profile/
├── profile.actions.ts
├── profile.service.ts
├── profile.repository.ts
└── profile.schema.ts
```

Crie apenas arquivos necessários ao tamanho do módulo.

## Regras

- valide novamente no servidor, mesmo com validação no cliente;
- verifique autorização dentro do caso de uso;
- retorne códigos estáveis para erros esperados;
- não exponha stack traces ou dados sensíveis;
- revalide cache após mutações;
- aplique transações e idempotência quando necessárias;
- não duplique regras entre Actions e Handlers: ambos chamam o mesmo Service.

## Evite

- Firestore em componentes;
- regra de negócio em páginas, Actions ou repositories;
- Firebase Admin em Client Components;
- endpoints genéricos que aceitam campos arbitrários;
- confiar em IDs, pontuação ou permissões enviados pelo cliente.

## Próximo documento

➡️ [Deployment](./07-deployment.md)
