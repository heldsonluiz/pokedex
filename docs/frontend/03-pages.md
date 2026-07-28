# Páginas

## Mapa de páginas

| Rota                          | Objetivo                | Conteúdo essencial                                  |
| ----------------------------- | ----------------------- | --------------------------------------------------- |
| `/login`                      | autenticar com Google   | apresentação, ação de login e erros                 |
| `/onboarding`                 | concluir perfil inicial | etapas, progresso e validação                       |
| `/home`                       | resumir o evento        | progresso, atalhos e atividades                     |
| `/companies`                  | listar patrocinadores   | categorias, busca e cards                           |
| `/companies/[companyId]`      | detalhar empresa        | descrição, links e status de visita                 |
| `/missions`                   | acompanhar missões      | filtros, progresso e estado                         |
| `/scan`                       | ler QR Code             | câmera, permissão, leitura e resultado              |
| `/passport`                   | exibir progresso        | visitas, missões e selos                            |
| `/ranking`                    | mostrar classificação   | posição atual, lista e nível                        |
| `/connections`                | gerenciar networking    | solicitações, conexões, aceite e remoção            |
| `/profile`                    | exibir o próprio perfil | dados públicos, progresso e ações                   |
| `/profile/edit`               | editar perfil           | formulário validado e feedback                      |
| `/profile/qr-code`            | compartilhar QR         | código, instrução e alternativa de compartilhamento |
| `/badges`                     | listar conquistas       | obtidas, bloqueadas e critérios públicos            |
| `/tickets`                    | consultar tickets       | nível de origem e sorteio relacionado               |
| `/talks`                      | mostrar agenda          | horários, palestrantes e status                     |
| `/talks/[talkId]`             | detalhar palestra       | descrição, presença e avaliação identificada        |
| `/qr/[eventId]/[type]/[qrId]` | tratar deep link de QR  | validação e redirecionamento seguro                 |

O fluxo de perfil já permite consultar os dados persistidos em `/profile` e editar nome, biografia, atuação, empresa, link e de três a cinco habilidades em `/profile/edit`. Somente nome e skills são obrigatórios. Habilidades são pesquisadas por nome ou alias no catálogo estático e persistidas pelo slug. O formulário valida no cliente para feedback imediato e repete a validação na Server Action antes da persistência; erros esperados são apresentados junto ao campo correspondente.

`/profile/qr-code` emite e apresenta o QR temporário do participante, informa a validade restante e renova o token automaticamente. O deep link valida sessão, assinatura, evento, UUID, expiração, existência do perfil e tentativa de auto-scan, mas não executa mutação de networking.

`/` redireciona imediatamente para `/login`. A página de login mantém logo e ilustração montados nas mesmas posições enquanto consulta a sessão sem cache por no mínimo dois segundos. Durante a consulta, exibe “Preparando sua jornada...”. Sem sessão, substitui somente a área inferior pelos textos e ação de login com fade-in; com sessão, segue para `/home`, onde o layout autenticado encaminha perfis incompletos ao onboarding.

`/onboarding` apresenta cinco etapas com imagem WebP otimizada, título, descrição, indicador e ação de avanço. O passo atual permanece no parâmetro `step`, sobrevivendo a refresh. O gesto horizontal para a esquerda avança e para a direita retorna, sem botão visual de voltar; a próxima imagem é pré-carregada. Imagem e textos saem na direção do movimento e a etapa seguinte entra pelo lado oposto em uma transição curta. A última etapa encaminha para `/onboarding/profile`, que reutiliza o formulário de perfil. Voltar do setup retorna ao início das etapas; cancelar encerra a sessão; salvar um perfil válido conclui o onboarding e encaminha para `/home`.

`/home` usa somente dados reais do perfil para apresentar saudação e avatar. O scanner é a ação principal; o QR Code do participante e os destinos de Missões, Passaporte e Perfil aparecem como atalhos. Ao abrir o QR Code pela Home, a origem controlada `source=home` faz o retorno levar novamente ao início; acessos sem essa origem retornam ao Perfil. Progresso, XP, ranking e atividades recentes não são simulados e serão incorporados quando seus contratos de domínio existirem. A página possui skeleton estrutural e erro recuperável para a leitura do perfil. A ação de logout fica em `/profile`, junto às demais ações de conta.

`/missions`, `/scan` e `/passport` já participam da navegação autenticada, mas exibem estados informativos até que suas respectivas regras de negócio sejam implementadas. Esses estados tornam os destinos navegáveis sem simular dados ou comportamentos ainda inexistentes.

## Composição

Páginas são Server Components por padrão e coordenam carregamento, metadata e composição. Interações como formulários, câmera e filtros locais devem ser isoladas em Client Components.

O layout autenticado é responsável pelo único `AppShell` das rotas funcionais. Ele escolhe tema, retorno seguro e presença de header e navegação inferior com base na rota. As páginas renderizam somente seu conteúdo e não criam shells ou elementos `main` adicionais.

Cada página deve tratar:

- carregamento e erro;
- ausência de dados;
- sessão e autorização;
- navegação de retorno quando aplicável;
- responsividade e acessibilidade;
- dados inválidos em rotas dinâmicas.

## Regras de experiência

- a ação principal deve estar clara e acessível com uma mão;
- preserve contexto ao retornar de detalhes;
- não revele IDs internos ou dados privados;
- confirme ações irreversíveis;
- ao remover uma conexão, informe que a XP recebida será revogada;
- permita avaliar palestra somente após presença registrada pelo QR Code exibido na saída;
- após mutações, atualize a interface e revalide os dados relacionados.

## Próximo documento

➡️ [Navegação](./04-navigation.md)
