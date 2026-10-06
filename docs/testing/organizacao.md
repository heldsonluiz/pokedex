# Organização da rodada com voluntários

## Objetivo e escopo

Validar a jornada de participante com até 20 pessoas usando **https://pokedex.heldsonluiz.dev.br/**. O roteiro cobre login, perfil, navegação, scanner, empresas, tags, missões por QR e automáticas, conexões, palestras, avaliações, ranking e conversões de tickets.

Ações administrativas ficam para uma rodada posterior: missão por reviewer, conversão assistida, resgate e entrega de brindes, bloqueios, fechamento e sorteio. As entidades ficam cadastradas agora, mas sua execução não será marcada como validada pelo grupo. Os dados são fictícios e não representam uma premiação real.

## Preparação antes do convite

- Publicar as alterações e confirmar qual commit está no domínio. As duas imagens novas só estarão disponíveis no site após o deploy.
- Confirmar que o domínio usa o mesmo projeto Firebase, `EVENT_ID` e `DEVMODE=true` do seed. A resposta 200 do login, sozinha, não comprova o banco nem o fluxo Google.
- Aguardar a renovação do cache de catálogos (até 15 minutos, com uma nova leitura após o prazo) ou invalidá-lo no deploy. Escritas diretas no Firestore não invalidam o cache da aplicação automaticamente.
- Conferir login Google com uma conta de participante e o catálogo novo. Se o OAuth estiver restrito a usuários de teste, liberar previamente as contas dos voluntários.
- Garantir acesso ao GitHub e issues habilitadas. A consulta pública do repositório retornou 404 nesta preparação; isso não comprova acesso para os convidados. Não é necessário dar permissão de escrita para relatar bugs. O formulário de issue estará disponível após chegar à branch padrão.
- Definir prazo (sugestão: 48 horas), contato para bloqueios e um horário de 20 minutos para conexões entre colegas.
- Distribuir identificadores V01 a V20. Registrar aparelho, sistema e navegador em uma planilha privada, evitando divulgar e-mails.
- Buscar variedade entre os voluntários: Android/Chrome, iPhone/Safari, aparelhos mais antigos, telas menores e diferentes familiaridades com tecnologia. Não exigir que cada pessoa instale navegadores extras.
- Avisar que nome, foto e dados de perfil podem ser vistos pelo grupo. Definir quando os dados de teste serão apagados após a triagem.
- Não resetar a base durante a rodada. Cada participante deve usar uma única conta Google.

## Massa preparada

| Cadastro                  | Quantidade | Observação                                            |
| ------------------------- | ---------: | ----------------------------------------------------- |
| Empresas                  |          8 | 50 XP por visita                                      |
| Tags                      |         22 | 75 XP por descoberta                                  |
| Missões                   |         17 | 7 por QR, 5 por reviewer e 5 automáticas              |
| Palestras                 |         24 | 6 avaliações encerradas, 6 abertas, 12 bloqueadas     |
| Palestrantes              |         26 | Inclui painéis com vários palestrantes                |
| Entradas de programação   |         24 | Necessárias para exibir palestras; horários fictícios |
| Brindes da Pokédex        |          6 | Operação de resgate posterior                         |
| Prêmios de sorteio        |          6 | Sorteios pendentes; operação posterior                |
| Participantes pré-criados |          0 | Cadastro real no primeiro login                       |

Quatro das oito empresas possuem missões com pré-requisito explícito:

| Empresa       | Missão por QR          |
| ------------- | ---------------------- |
| Aurora Cloud  | Conheça a Aurora Cloud |
| Byte Forge    | Desafio da Byte Forge  |
| Code Cauldron | Caldeirão do Código    |
| Data Crypt    | Guardião dos Dados     |

Outras missões por QR: Encontre o QR secreto, Trilha do Terminal (depende do QR secreto) e Consulte o Oráculo da Nuvem. As metas automáticas de conexões são 2, 5 e 10: a maior exige 11 pessoas disponíveis, pois não existe autoconexão. Com um grupo menor, registrar essa meta como não testada. As metas de empresas são três visitas e todas as oito.

## Scripts e limpeza

O preparador específico não usa o reset geral que cria 150 perfis fictícios. Carrega `.env.local`, exige `DEVMODE=true` e aceita somente uma origem HTTPS. Simulação:

```sh
node scripts/prepare-volunteer-tests.mjs --target https://pokedex.heldsonluiz.dev.br
```

A aplicação exige `--apply --confirm` com o valor exato mostrado pela simulação. Essa operação foi autorizada pelo responsável para **todas as coleções raiz `test_` e seus descendentes**, incluindo participantes, progresso e cadastro administrativo anteriores. Coleções sem esse prefixo, contas do Firebase Authentication e arquivos do Storage não são alterados.

Antes de excluir, o script exporta um snapshot privado em `/tmp/pokedex-volunteer-backup-<timestamp>/snapshot.json`, com tipos do Firestore identificados e hash SHA-256 no log. Não inclui credenciais, mas contém dados anteriores: não compartilhar nem versionar. É um snapshot para recuperação técnica, não um backup gerenciado do Firebase; não há comando de restauração automática neste kit. Copiar para armazenamento privado durável se precisar guardá-lo além desta sessão.

O reset não é atômico e deve ocorrer sem acessos concorrentes. Em caso de falha, verificar a fase alcançada antes de repetir. O cadastro `test_adminUsers` anterior também é exportado e removido: preparar novamente os papéis necessários antes da rodada administrativa.

Para gerar os QRs a partir do catálogo gravado:

```sh
node scripts/generate-volunteer-kit.mjs --target https://pokedex.heldsonluiz.dev.br
```

Para conferir automaticamente os PNGs gerados:

```sh
node scripts/verify-volunteer-kit.mjs
```

A conferência decodifica a página inteira com `TRY_HARDER` e a região do QR com a configuração padrão do leitor. Verifica a URL exata dos 38 códigos. Isso não substitui uma leitura física com câmera, iluminação e distância reais. O gerador preserva a grade de impressão em 1050 × 1480 pixels, a 254 dpi.

Saída: `artifacts/volunteer-tests/`, contendo uma galeria `index.html`, roteiro em HTML e Markdown, manifesto e 38 PNGs (37 do catálogo e um controle externo). Distribuir a pasta inteira ou o ZIP correspondente; abrir `index.html` em outra tela. É possível imprimir os PNGs ou salvar a galeria como PDF pelo navegador. A alternativa de abrir links ajuda na recuperação, mas não conta como teste de câmera. QRs pessoais são temporários e devem ser mostrados pelos próprios participantes.

## Condução e cobertura

Começar com duas pessoas por 15 minutos para descobrir bloqueios de login, acesso ao kit ou instruções. Depois liberar o restante do grupo. Oferecer ajuda sem indicar imediatamente cada botão: registrar onde a pessoa ficou confusa.

Todos fazem T01 a T10, marcando as partes não executadas. Para cobrir todas as tags sem cansar cada pessoa, distribuir códigos em rodízio entre duplas, garantindo pelo menos uma leitura de cada uma pelo grupo. Cada participante testa ao menos duas tags e uma repetição. O roteiro comum cobre as oito empresas e sete missões por QR.

Manter uma tabela privada de cobertura:

| Pessoa | Aparelho/navegador | T01 | T02 | T03 | T04 | T05 | T06 | T07 | T08 | T09 | T10 | Issues |
| ------ | ------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ------ |
| V01    | Preencher          | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —      |

Usar Passou, Falhou ou Não testei, com motivo. Manter também uma lista dos 37 QRs públicos para controlar cobertura por código; o manifesto do kit fornece os nomes.

## Triagem e encerramento

Ler as issues diariamente, juntar duplicatas e classificar:

- **Bloqueador:** impede login ou conclusão de um fluxo essencial, sem alternativa.
- **Alto:** perde dados, duplica XP/tickets ou apresenta progresso incorreto.
- **Médio:** existe alternativa, mas o fluxo apresenta erro ou confusão relevante.
- **Baixo:** apresentação, texto ou melhoria sem impedir o uso.

Pedir a alguém que relatou um problema para testar a correção. Registrar o commit corrigido e o resultado da repetição. Não concluir que um caso passou pela ausência de issue.

Critério sugerido para encerrar: todos os fluxos autônomos cobertos, diversidade de aparelhos registrada, nenhum bloqueador ou erro de saldo/progresso aberto e demais problemas triados com decisão explícita. O grupo de 20 avalia usabilidade e funcionamento; não substitui testes de carga para o público do evento.

## Convite sugerido

> Olá! Você pode ajudar a testar nossa Pokédex? Use https://pokedex.heldsonluiz.dev.br/ com sua conta Google e reserve cerca de 45 a 60 minutos até [prazo]. Enviarei o roteiro e o kit de QR Codes, que você deve abrir em outra tela ou imprimir. Os dados e prêmios são fictícios. Combinaremos [horário] para testar conexões entre participantes. Se encontrar um problema, siga o roteiro para abrir uma issue; se ficar bloqueado ou sem acesso ao GitHub, fale comigo por [contato]. Ao terminar, envie também o que funcionou e o que ficou confuso.

Preencher prazo, horário e contato antes de enviar. Nenhum convite foi enviado automaticamente.

## Execução desta preparação — 09/09/2026

- Reset aplicado exclusivamente nas coleções `test_`, após confirmação do responsável.
- Snapshot privado com 905 documentos: `/tmp/pokedex-volunteer-backup-1788976884223/snapshot.json`.
- SHA-256: `df01c85f9d9bf8f505d7a8e33c7746de46b49f562f55f8afc29d8dbacc4541fb`.
- Catálogo gravado e contagens conferidas: 154 documentos; zero participantes após o reset.
- Os 38 PNGs foram decodificados com correspondência exata às URLs do manifesto.
- Kit gerado para `https://pokedex.heldsonluiz.dev.br`, com 37 QRs de atividades e um controle externo.
- `pnpm check` aprovado: tipos, lint, formatação e 184 testes; `pnpm build` aprovado.
- Domínio respondeu 200 em `/login`. O login real Google e a configuração remota do banco ainda precisam ser conferidos antes dos convites.
- Publicação da branch, deploy das imagens e acesso dos convidados ao GitHub permanecem pendentes.
