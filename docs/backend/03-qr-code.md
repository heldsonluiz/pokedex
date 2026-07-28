# QR Code

QR Codes são links para páginas internas da aplicação. As leituras exigem conexão e são validadas no servidor.

## Formato

```text
/qr/{eventId}/{type}/{qrId}
```

Tipos iniciais: `user`, `company`, `talk` e `mission`.

`qrId` é um UUID v4 público, aleatório e estável, diferente do ID interno do documento do Firestore. A aleatoriedade torna colisões desprezíveis na escala do evento, mas o identificador não é tratado como segredo ou autorização.

QR Codes de empresas, palestras e missões permanecem válidos durante o evento. O QR Code de participante acrescenta um token temporário:

```text
/qr/{eventId}/user/{qrId}?token={signedToken}
```

O token contém versão, `eventId`, tipo, `qrId`, emissão, expiração e nonce. O servidor assina o payload com HMAC-SHA-256 usando `QR_SIGNING_SECRET`. A validade é de 60 segundos, com tolerância máxima de cinco segundos para diferenças de relógio. A interface solicita um novo token dez segundos antes da expiração.

## Fluxo

```text
leitura → página interna → validação no servidor → transação/idempotência
→ resultado amigável
```

O scanner apenas controla câmera e leitura. Regras de networking, visita, presença, missão, XP ou tickets pertencem ao serviço correspondente.

## Validação

O servidor verifica:

- sessão e autorização;
- origem e formato da URL;
- evento ativo e correspondente;
- tipo permitido e existência do `qrId`;
- assinatura, claims e expiração do token para participantes;
- validade temporal quando aplicável;
- duplicidade da ação;
- regras específicas do domínio.

Existe um intervalo mínimo de um minuto entre scans do mesmo tipo. Um scan de participante cria uma solicitação de conexão; a XP só é concedida após o aceite do destinatário.

Códigos de erro estáveis incluem `INVALID_QR`, `QR_NOT_FOUND`, `QR_ALREADY_SCANNED`, `INVALID_EVENT` e `UNAUTHORIZED`.

## Segurança

- nunca confie no conteúdo lido;
- não exponha IDs internos;
- não trate `qrId` como segredo ou autorização;
- mantenha `QR_SIGNING_SECRET` somente no servidor;
- não conceda XP ou tickets no cliente;
- use operações idempotentes e transações quando houver concorrência;
- aplique limitação de frequência quando necessário;
- não execute mutação automaticamente ao abrir um deep link.

Abrir o deep link de participante apenas valida o código e apresenta um resultado. A criação da solicitação de conexão pertence à fase de networking e exigirá confirmação explícita.

## Próximo documento

➡️ [Segurança](./04-security.md)
