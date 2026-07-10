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

## Composição

Páginas são Server Components por padrão e coordenam carregamento, metadata e composição. Interações como formulários, câmera e filtros locais devem ser isoladas em Client Components.

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
