# QR Code

QR Codes são links para páginas internas da aplicação. As leituras exigem conexão e são validadas no servidor.

## Formato

```text
/qr/{eventId}/{type}/{qrId}
```

Tipos iniciais: `user`, `company`, `talk` e `mission`.

`qrId` é um UUID v4 público, aleatório e estável, diferente do ID interno do documento do Firestore. A aleatoriedade torna colisões desprezíveis na escala do evento, mas o identificador não é tratado como segredo ou autorização.

O contrato central em `modules/qr-code/qr-code.contract.ts` define os tipos, constrói URLs e interpreta valores externos. A URL completa aceita no máximo 4.096 caracteres, deve usar `http` ou `https`, possuir a mesma origem de `NEXT_PUBLIC_APP_URL`, não pode conter credenciais ou fragmento e deve corresponder exatamente ao formato documentado. O `eventId` deve ser o `EVENT_ID` da implantação e `qrId` deve ser um UUID válido.

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

A validação ocorre em camadas:

```text
texto externo → origem e estrutura → evento e tipo → assinatura temporária
→ existência da entidade → autorização e regra de domínio
```

O contrato central verifica:

- tamanho, protocolo e origem da URL;
- formato exato do caminho;
- evento configurado na implantação;
- tipo permitido e UUID válido;
- ausência de fragmentos e parâmetros inesperados;
- presença de um único token para participantes.

Depois dessa validação estrutural, o servidor verifica:

- sessão e autorização;
- existência da entidade identificada pelo `qrId`;
- assinatura, claims e expiração do token para participantes;
- duplicidade da ação;
- regras específicas do domínio.

O status ativo de empresas, palestras e missões será validado pelos serviços correspondentes quando essas entidades forem implementadas.

Existe um intervalo mínimo de um minuto entre scans do mesmo tipo. Um scan de participante cria uma solicitação de conexão; a XP só é concedida após o aceite do destinatário.

Erros estruturais estáveis incluem `INVALID_QR`, `INVALID_ORIGIN`, `INVALID_EVENT`, `UNSUPPORTED_QR_TYPE` e `MISSING_TOKEN`. Validações temporais acrescentam `QR_EXPIRED`. As fases de domínio acrescentarão erros como `QR_NOT_FOUND`, `QR_ALREADY_SCANNED` e `UNAUTHORIZED` quando suas respectivas operações existirem.

O parser e a assinatura possuem testes automatizados para URLs válidas, quatro tipos de alvo, origem externa, credenciais embutidas, outro evento, tipo desconhecido, UUID inválido, token ausente, parâmetros inesperados, tamanho máximo, assinatura ou payload alterados, expiração e tolerância de relógio.

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
