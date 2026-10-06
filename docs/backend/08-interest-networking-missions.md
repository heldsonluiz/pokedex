# Networking por interesse

## Cadastro administrativo

No painel do site, selecionar **Progresso automático** e depois **Networking por
interesse**. Informar a quantidade de pessoas na meta, além dos campos comuns
(título, descrição, imagem opcional, XP, ordem e status).

```json
{
  "validationType": "automatic",
  "qrId": null,
  "keywordConfig": null,
  "progressRequirement": { "type": "shared-interests", "target": 3 },
  "prerequisites": []
}
```

A meta é um inteiro positivo. O valor `all` não é permitido. Essas missões não
possuem QR próprio nem pré-requisitos, e usam o fluxo automático já existente.

## Interesses e conexões

O perfil e o onboarding permitem selecionar opcionalmente até cinco interesses.
A lista padronizada é mantida em `modules/profile/profile-interests.ts`. Inclui
IA, cloud, web, mobile, dados, segurança, acessibilidade, carreira, open source,
empreendedorismo, design, frontend, backend, DevOps, testes, arquitetura, bancos
de dados, IA generativa, machine learning, IoT, jogos, automação, liderança,
comunidades, educação, métodos ágeis, observabilidade, performance e privacidade.
Perfis antigos sem `interests` continuam válidos e são tratados como sem interesses.

Ao criar uma conexão, a transação lê os interesses dos dois perfis e grava a
interseção em `connections.sharedInterests`. Cada pessoa conectada conta apenas
uma vez, independentemente de quantos interesses compartilha. Alterações
posteriores no perfil não alteram a interseção gravada. Uma conexão removida e
reativada preserva sua interseção original, evitando que edições do perfil
reciclem a conexão. Conexões antigas sem o campo não contam; não há backfill.

Somente conexões aceitas, com outra pessoa e no mesmo evento contam. Antes da
conclusão, remover uma conexão reduz o progresso; após a conclusão, a conquista
e seu XP permanecem. O sistema confere as conexões em transação antes de gravar
conclusão, incrementar XP e atualizar o resumo. Reenvios não duplicam XP.

A conclusão é avaliada ao abrir ou atualizar `/missions`, como nas outras
missões automáticas. O catálogo mostra a quantidade alcançada e oferece um
atalho para editar os interesses no perfil. Os interesses são independentes
das habilidades profissionais já existentes.

## Verificação manual

1. Cadastrar a missão no painel com meta 1, nos ambientes correspondentes.
2. Em dois perfis de participantes, selecionar pelo menos um interesse igual.
3. Conectar os participantes por leitura do QR e abrir `/missions`.
4. Conferir conclusão, recompensa única e passaporte para ambos.
5. Em outros perfis, conectar sem interesses em comum e conferir progresso zero.
6. Editar os interesses depois da conexão e confirmar que ela não passa a contar.
7. Com meta 2, remover uma conexão antes da conclusão e verificar o progresso.
8. Conferir em celular a seleção de interesses, o limite de cinco e a edição.

Nenhum script de carga ou migração é executado para habilitar esse formato.
