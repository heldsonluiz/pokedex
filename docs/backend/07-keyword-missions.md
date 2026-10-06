# Missões por palavra-chave

## Cadastro

O painel administrativo do `site-devfest` permite criar e editar este tipo em
`/admin/missions`: selecionar **Palavra-chave**, informar uma resposta aceita
por linha e o limite de tentativas. Para cadastrar via integração, gravar em
`missions/{missionId}` os campos comuns de missão e:

```json
{
  "validationType": "keyword",
  "qrId": null,
  "progressRequirement": null,
  "keywordConfig": {
    "acceptedAnswers": ["Conexão", "Networking"],
    "maxAttempts": 3
  },
  "prerequisites": []
}
```

Os campos comuns são `eventId`, `title`, `description`, `imageUrl` (ou `null`),
`active`, `order`, `xpAwarded` (positivo ou `null` para usar o padrão),
`createdAt` e `updatedAt` (Firestore Timestamp). O ID é o ID do documento.
Pré-requisitos opcionais usam `{ "type": "company" | "mission", "activityId": "..." }`.
O painel deve invalidar o cache de missões conforme o fluxo já existente.

## Resposta e tentativas

O participante responde no diálogo da missão. A ação recebe apenas `missionId`
e `answer`; evento e participante são derivados da sessão. Maiúsculas, acentos,
espaços nas extremidades e espaços internos repetidos são ignorados. Pontuação
é preservada. Uma das respostas cadastradas deve corresponder integralmente.

`missionAttempts/{completionId}` armazena `eventId`, `participantId`, `missionId`,
`attempts` e `updatedAt`. O ID é o mesmo hash determinístico da conclusão.
Em DEVMODE, a coleção recebe o prefixo `test_`.

Cada resposta válida enviada consome uma tentativa, inclusive a correta.
Respostas vazias ou inválidas, missões indisponíveis e pré-requisitos pendentes
não consomem tentativas. O último envio permitido pode concluir a missão.
Depois do limite, novos envios são recusados. Reenvios de missão concluída
retornam a conclusão existente e não consomem tentativas nem concedem novo XP.

A contagem, conclusão, XP do perfil e incremento do resumo usam a mesma
transação. O servidor não persiste as respostas enviadas nem as inclui em logs.
Aumentar `maxAttempts` permite novas tentativas; alterar a resposta não zera o
contador existente.

## Acesso

`keywordConfig.acceptedAnswers` nunca é incluído nas projeções enviadas ao
participante. O servidor expõe apenas `keywordMaxAttempts`. Documentos brutos de
`missions` que contenham respostas e a coleção `missionAttempts` devem ter
leitura e escrita exclusivas do backend; Firestore Rules não ocultam campos de
um documento. As Rules versionadas no `site-devfest/firestore.rules` bloqueiam leitura e
escrita dessas coleções pelo Client SDK. Esse bloqueio deve ser mantido.

## Verificação manual

Cadastrar uma missão de teste em DEVMODE, abrir `/missions`, responder com uma
variante sem acentos e conferir conclusão, XP e passaporte. Em outro participante,
esgotar tentativas e conferir que uma resposta correta posterior é recusada.
Testar em celular a digitação, envio, mensagens e atualização do catálogo.

## Novos formatos

Toda nova missão implementada na Pokedex deve incluir o formulário de criação
e edição correspondente no painel administrativo do site, contratos compatíveis
e validação no backend dos dois projetos.
