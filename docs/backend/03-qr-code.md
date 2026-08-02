# QR Code

QR Codes são links para páginas internas da aplicação. As leituras exigem conexão e são validadas no servidor.

## Formato

```text
/qr/{eventId}/{type}/{qrId}
```

Tipos: `user`, `company`, `mission` e `tag`.

`qrId` é um UUID v4 público, aleatório e estável, diferente do ID interno do documento do Firestore. A aleatoriedade torna colisões desprezíveis na escala do evento, mas o identificador não é tratado como segredo ou autorização.

O contrato central em `modules/qr-code/qr-code.contract.ts` define os tipos, constrói URLs e interpreta valores externos. A URL completa aceita no máximo 4.096 caracteres, deve usar `http` ou `https`, possuir a mesma origem de `NEXT_PUBLIC_APP_URL`, não pode conter credenciais ou fragmento e deve corresponder exatamente ao formato documentado. O `eventId` deve ser o `EVENT_ID` da implantação e `qrId` deve ser um UUID válido.

QR Codes de empresas, missões automáticas e tags são fixos e não expiram. Seu
uso pode ser interrompido desativando a entidade no Firestore. Palestras não
possuem QR Code; suas avaliações são liberadas após o horário de encerramento.
O QR Code de participante acrescenta um token temporário:

```text
/qr/{eventId}/user/{qrId}?token={signedToken}
```

Para reduzir a densidade do QR Code, o token v3 usa uma representação binária de
33 bytes: um byte de versão, quatro de emissão, doze de nonce e dezesseis de
assinatura. O resultado possui 44 caracteres em Base64 URL-safe. A expiração é
derivada da emissão e da duração fixa de 60 segundos.

O servidor calcula HMAC-SHA-256 sobre o payload binário e o contexto formado por
`eventId`, tipo e `qrId`, usando `QR_SIGNING_SECRET`, e conserva 128 bits da
assinatura. Assim, os dados já presentes na URL não são repetidos no token, mas
continuam protegidos contra alteração ou reutilização em outro alvo. Existe
tolerância máxima de cinco segundos para diferenças de relógio. A interface
solicita um novo token dez segundos antes da expiração.

## Fluxo

```text
leitura → página interna → validação no servidor → transação/idempotência
→ resultado amigável
```

O scanner apenas controla câmera e leitura. Antes de navegar, ele aplica o
contrato central ao texto lido, bloqueia leituras repetidas enquanto processa o
resultado e exige conexão. Regras de networking, visita, presença, missão, XP
ou tickets pertencem ao serviço correspondente.

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

O status ativo de empresas, tags e missões é validado pelos serviços
correspondentes.

Uma leitura válida de empresa abre o deep link da entidade. A página
autenticada dispara uma Server Action para registrar a visita; a requisição
`GET` não altera dados. O servidor cria uma conclusão determinística, concede o
XP padrão ou a sobrescrita da empresa e registra o carimbo na mesma transação.
Reabrir a URL retorna a visita existente sem duplicar pontuação.

Uma leitura válida de tag abre `/qr/{eventId}/tag/{qrId}` e dispara uma Server
Action autenticada. A primeira descoberta registra uma conclusão permanente e
concede o XP padrão ou sobrescrito; releituras não duplicam a recompensa. Nome,
imagem e descrição são apresentados somente depois da validação do servidor.

Missões automáticas abrem `/qr/{eventId}/mission/{qrId}`. O servidor confirma
que a missão aceita QR, está ativa, teve seus pré-requisitos cumpridos e ainda
não foi concluída. Missões presenciais não possuem QR próprio: um reviewer ou
admin escolhe a missão e usa o scanner em modo de revisão para ler o QR
temporário do participante.

Uma leitura válida de participante feita pelo scanner cria a conexão
automaticamente e concede 5 XP a cada participante. A operação é idempotente:
reler uma conexão ativa não duplica a conexão nem a pontuação. Depois de uma
remoção, existe um intervalo mínimo de um minuto antes de recriar o mesmo par.
A remoção preserva o histórico e revoga de ambos a XP registrada na conexão.

Erros estruturais estáveis incluem `INVALID_QR`, `INVALID_ORIGIN`, `INVALID_EVENT`, `UNSUPPORTED_QR_TYPE` e `MISSING_TOKEN`. Validações temporais acrescentam `QR_EXPIRED`. As fases de domínio acrescentarão erros como `QR_NOT_FOUND`, `QR_ALREADY_SCANNED` e `UNAUTHORIZED` quando suas respectivas operações existirem.

O parser e a assinatura possuem testes automatizados para URLs válidas, quatro tipos de alvo, origem externa, credenciais embutidas, outro evento, tipo desconhecido, UUID inválido, token ausente, parâmetros inesperados, tamanho máximo, assinatura ou payload alterados, expiração e tolerância de relógio.

## Material para impressão

O script `scripts/generate-event-qr-pdf.mjs` consulta o Firestore e gera
`artifacts/event-qr-codes-a4.pdf`, um PDF multipágina em tamanho A4. O material
é separado por categoria e inclui:

- empresas ativas com `qrId`;
- tags ativas com `qrId`;
- missões ativas com `validationType: "qr"` e `qrId`.

Entidades inativas e missões validadas por reviewer não são incluídas. Cada
quadro reproduz o material individual: tipo, nome, QR Code vetorial, instrução
de leitura e nome do evento, sem expor a URL ou o ID interno. Empresas são
distribuídas em uma grade 2×2, com cada quadro próximo do tamanho A6. Tags e
missões usam uma grade 3×3. Linhas finas nos espaços entre os quadros ajudam no
corte sem invadir a margem de segurança dos QR Codes.

Para gerar ou atualizar o arquivo:

```bash
node --env-file=.env.local scripts/generate-event-qr-pdf.mjs
```

As URLs são construídas com `EVENT_ID` e `NEXT_PUBLIC_APP_URL` do ambiente
carregado. Portanto, um PDF gerado com `NEXT_PUBLIC_APP_URL` apontando para
`http://localhost:3000` serve apenas para testes locais. O material definitivo
deve ser regenerado depois que a origem pública de produção estiver
configurada.

Antes de distribuir o material:

1. confirme a origem informada pelo gerador;
2. teste ao menos um código de empresa, tag e missão no ambiente pretendido;
3. imprima em papel A4 com escala de 100%, sem redimensionamento automático;
4. mantenha contraste e área branca ao redor dos códigos;
5. regenere o PDF sempre que uma entidade for ativada, desativada ou tiver seu
   `qrId` alterado.

## Segurança

- nunca confie no conteúdo lido;
- não exponha IDs internos;
- não trate `qrId` como segredo ou autorização;
- mantenha `QR_SIGNING_SECRET` somente no servidor;
- não conceda XP ou tickets no cliente;
- use operações idempotentes e transações quando houver concorrência;
- aplique limitação de frequência quando necessário;
- não execute mutação automaticamente ao abrir um deep link.

Abrir diretamente o deep link de participante apenas valida o código e
apresenta um resultado. A criação automática da conexão acontece somente por
uma leitura no scanner autenticado, nunca pela simples abertura da URL.

## Próximo documento

➡️ [Segurança](./04-security.md)
