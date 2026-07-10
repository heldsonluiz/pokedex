# QR Code

QR Codes são links para páginas internas da aplicação. As leituras exigem conexão e são validadas no servidor.

## Formato

```text
/qr/{eventId}/{type}/{qrId}
```

Tipos iniciais: `user`, `company`, `talk` e `mission`.

`qrId` é um identificador público aleatório, diferente do ID do Firestore, único dentro do evento. O formato inicial usa dez caracteres alfanuméricos maiúsculos. QR Codes de empresas, palestras e missões permanecem válidos durante o evento; o QR Code de participante expira após um minuto.

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
- validade temporal quando aplicável;
- duplicidade da ação;
- regras específicas do domínio.

Existe um intervalo mínimo de um minuto entre scans do mesmo tipo. Um scan de participante cria uma solicitação de conexão; a XP só é concedida após o aceite do destinatário.

Códigos de erro estáveis incluem `INVALID_QR`, `QR_NOT_FOUND`, `QR_ALREADY_SCANNED`, `INVALID_EVENT` e `UNAUTHORIZED`.

## Segurança

- nunca confie no conteúdo lido;
- não exponha IDs internos;
- não conceda XP ou tickets no cliente;
- use operações idempotentes e transações quando houver concorrência;
- aplique limitação de frequência quando necessário;
- não execute mutação automaticamente ao abrir um deep link.

## Próximo documento

➡️ [Segurança](./04-security.md)
