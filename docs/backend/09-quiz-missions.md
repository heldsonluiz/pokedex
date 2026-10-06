# Quiz relâmpago

## Cadastro no painel

Em **Missões → Adicionar missão**, selecionar **Quiz relâmpago**. Preencher os
campos comuns (título, descrição, imagem opcional, XP, ordem e status), mínimo
de acertos e limite de tentativas. Adicionar de 1 a 10 perguntas, com enunciado,
2 a 3 alternativas diferentes e uma alternativa correta por pergunta.
O formulário começa com três alternativas e permite adicionar ou remover.
Todas as perguntas têm o mesmo peso; a primeira versão não tem cronômetro.

Contrato adicional em `missions/{missionId}`:

```json
{
  "validationType": "quiz",
  "qrId": null,
  "keywordConfig": null,
  "progressRequirement": null,
  "quizConfig": {
    "questions": [
      {
        "id": "pergunta-1",
        "prompt": "Quanto é 1 + 1?",
        "options": ["2", "3"],
        "correctOptionIndex": 0
      }
    ],
    "minCorrectAnswers": 1,
    "maxAttempts": 3
  },
  "prerequisites": []
}
```

O painel gera IDs para as perguntas. O índice correto começa em zero. Enunciados
aceitam até 500 caracteres, alternativas até 200. O mínimo de acertos deve ser
entre 1 e o número de perguntas, e as tentativas entre 1 e 100. Nos outros tipos,
`quizConfig` é omitido ou `null`, preservando cadastros existentes.
Pré-requisitos de empresas e outras missões são opcionais.

## Participação e correção

O participante responde às perguntas no diálogo da missão e envia o conjunto.
A projeção pública inclui perguntas, alternativas, mínimo de acertos, tentativas
e revisão do quiz (`updatedAt` em milissegundos), sem `correctOptionIndex`.
O servidor deriva participante e evento da sessão e corrige usando o gabarito
lido no Firestore. Não aceita pontuação nem XP fornecidos pelo cliente.

Cada envio completo e válido consome uma tentativa, incluindo o envio aprovado.
Respostas incompletas, duplicadas, desconhecidas ou com alternativas inválidas
não consomem tentativas. A aprovação é possível na última tentativa permitida.
Ao esgotar o limite, novos envios são recusados. Missões já concluídas retornam
a conclusão existente sem consumir tentativas nem conceder XP novamente.

Contadores usam `missionAttempts/{completionId}`, com o mesmo ID determinístico
da conclusão. Contador, conclusão, XP e resumo individual são gravados na mesma
transação. A reprovação não concede XP. O retorno não revela quais alternativas
são corretas nem persiste as respostas enviadas. DEVMODE aplica o prefixo `test_`.

Se a missão for editada, uma resposta com revisão antiga é recusada sem consumir
tentativa. O participante deve reabrir a missão com o catálogo atualizado.
Editar perguntas não reinicia tentativas; aumentar o limite permite novos envios.

## Acesso

O gabarito é visível somente no painel administrativo autorizado e no backend.
As Rules do site bloqueiam acesso direto às missões e às tentativas pelo Client
SDK. O painel deve preservar esse bloqueio e invalidar o cache conforme o fluxo
existente quando atualizar os catálogos.

## Verificação manual

1. Cadastrar um quiz em DEVMODE no painel e abrir `/missions` na Pokedex.
2. Conferir perguntas, mínimo de acertos, limite e navegação no celular.
3. Enviar um conjunto abaixo do mínimo e conferir a mensagem de erro.
4. Aprovar na última tentativa e conferir XP, resumo e passaporte.
5. Reabrir a missão concluída e confirmar que não há nova recompensa.
6. Em outro participante, esgotar o limite e conferir recusa de novos envios.
7. Editar o quiz durante uma resposta e conferir o pedido para reabrir a missão.
8. Criar e editar perguntas e alternativas; ativar/desativar a missão e conferir
   que o gabarito e as configurações continuam preservados.
