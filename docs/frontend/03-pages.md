# Páginas

## Mapa de páginas

| Rota                          | Objetivo                | Conteúdo essencial                                  |
| ----------------------------- | ----------------------- | --------------------------------------------------- |
| `/login`                      | autenticar com Google   | apresentação, ação de login e erros                 |
| `/onboarding`                 | concluir perfil inicial | etapas, progresso e validação                       |
| `/home`                       | resumir o evento        | progresso, atalhos e atividades                     |
| `/companies`                  | listar patrocinadores   | categorias, busca e cards                           |
| `/companies/[companyId]`      | detalhar empresa        | descrição, links e status de visita                 |
| `/tags`                       | acompanhar descobertas  | progresso, slots bloqueados e tags reveladas        |
| `/missions`                   | missões ou revisão      | catálogo do participante ou seleção do reviewer     |
| `/missions/review/{id}`       | validar missão          | scanner restrito ao QR temporário do participante   |
| `/scan`                       | ler QR Code             | câmera, permissão, leitura e resultado              |
| `/passport`                   | exibir progresso        | resumo, conquistas e coleções da jornada            |
| `/ranking`                    | mostrar classificação   | posição atual, lista e nível                        |
| `/connections`                | gerenciar networking    | conexões criadas pelo scanner e remoção             |
| `/profile`                    | exibir o próprio perfil | dados públicos, progresso e ações                   |
| `/profile/edit`               | editar perfil           | formulário validado e feedback                      |
| `/profile/qr-code`            | compartilhar QR         | código, instrução e alternativa de compartilhamento |
| `/badges`                     | listar conquistas       | obtidas, bloqueadas e critérios públicos            |
| `/tickets`                    | consultar tickets       | nível de origem e sorteio relacionado               |
| `/talks`                      | mostrar agenda          | horários, palestrantes e status                     |
| `/talks/[talkId]`             | detalhar palestra       | descrição, horário e avaliação identificada         |
| `/qr/[eventId]/[type]/[qrId]` | tratar deep link de QR  | validação e redirecionamento seguro                 |

O fluxo de perfil já permite consultar os dados persistidos em `/profile` e editar nome, biografia, atuação, empresa, link e de três a cinco habilidades em `/profile/edit`. Somente nome e skills são obrigatórios. Habilidades são pesquisadas por nome ou alias no catálogo estático e persistidas pelo slug. O formulário valida no cliente para feedback imediato e repete a validação na Server Action antes da persistência; erros esperados são apresentados junto ao campo correspondente.

`/profile/qr-code` emite e apresenta o QR temporário do participante, informa a validade restante e renova o token automaticamente. O deep link valida sessão, assinatura, evento, UUID, expiração, existência do perfil e tentativa de auto-scan, mas não executa mutação de networking.

`/` redireciona imediatamente para `/login`. A página de login mantém logo e ilustração montados nas mesmas posições enquanto consulta a sessão sem cache por no mínimo dois segundos. Durante a consulta, exibe “Preparando sua jornada...”. Sem sessão, substitui somente a área inferior pelos textos e ação de login com fade-in; com sessão, segue para `/home`, onde o layout autenticado encaminha perfis incompletos ao onboarding.

`/onboarding` apresenta cinco etapas com imagem WebP otimizada, título, descrição, indicador e ação de avanço. O passo atual permanece no parâmetro `step`, sobrevivendo a refresh. O gesto horizontal para a esquerda avança e para a direita retorna, sem botão visual de voltar; a próxima imagem é pré-carregada. Imagem e textos saem na direção do movimento e a etapa seguinte entra pelo lado oposto em uma transição curta. A última etapa encaminha para `/onboarding/profile`, que reutiliza o formulário de perfil. Voltar do setup retorna ao início das etapas; cancelar encerra a sessão; salvar um perfil válido conclui o onboarding e encaminha para `/home`.

`/home` usa somente dados reais do perfil para apresentar saudação e avatar. O scanner é a ação principal; o QR Code do participante e os destinos de Missões, Passaporte e Perfil aparecem como atalhos. Ao abrir o QR Code pela Home, a origem controlada `source=home` faz o retorno levar novamente ao início; acessos sem essa origem retornam ao Perfil. Progresso, XP, ranking e atividades recentes não são simulados e serão incorporados quando seus contratos de domínio existirem. A página possui skeleton estrutural e erro recuperável para a leitura do perfil. A ação de logout fica em `/profile`, junto às demais ações de conta.

A Home também oferece acesso ao catálogo de empresas. `/companies` lista
somente empresas ativas do evento atual, ordenadas pelo nome, e mostra quantas
já foram visitadas. Cada card informa o estado do carimbo e abre
`/companies/[companyId]`. O detalhe apresenta logo, descrição, XP e instrução
para encontrar o QR Code; depois da visita, passa a exibir a imagem do carimbo,
o momento da conquista e a pontuação recebida. O catálogo possui estados de
carregamento, vazio e erro recuperável.

`/scan` inicia a câmera automaticamente, aceita tanto a webcam quanto as câmeras
do smartphone e prioriza a câmera traseira quando ela estiver disponível. O
stream é encerrado ao sair da página, ocultar a aplicação ou obter a primeira
leitura, antes da validação e da navegação. O valor lido passa pelo contrato
central de QR Code. Códigos externos, inválidos, de outro evento ou sem suporte
recebem mensagens específicas; falta de permissão, câmera ocupada, contexto sem
HTTPS e ausência de conexão também possuem estados recuperáveis. Participantes
criam conexões; empresas, tags e missões automáticas abrem seus respectivos
deep links. No modo de revisão, a câmera aceita somente o QR temporário de um
participante.

Ao reconhecer um QR Code válido de participante, o scanner chama a Server
Action que repete a validação de evento, assinatura e expiração e cria a
conexão automaticamente. Os dois participantes recebem 5 XP. Abrir diretamente
o deep link apenas apresenta sua validade e não executa a mutação.

`/qr/[eventId]/company/[qrId]` aceita tanto navegação pelo scanner interno
quanto abertura pela câmera do smartphone. Sem sessão, preserva o caminho no
login. Depois da autenticação, apresenta “Validando sua visita” enquanto uma
Server Action registra a primeira conclusão. O sucesso informa XP e carimbo;
releituras informam que a empresa já pertence ao passaporte sem pontuar
novamente. Empresa inexistente, inativa, evento inválido, perfil incompleto e
falha inesperada possuem resultados específicos. Visitas e carimbos não podem
ser removidos pelo participante.

`/tags` apresenta o total encontrado e uma grade da coleção. Tags bloqueadas
usam slots anônimos e não expõem nome, imagem, descrição ou localização. Depois
do scan, o slot revela esses dados e o XP concedido. O deep link
`/qr/[eventId]/tag/[qrId]` funciona pelo scanner interno ou pela câmera externa,
preserva o destino no login e trata descoberta nova, releitura, tag inativa,
tag inexistente, outro evento, perfil incompleto e erro inesperado. Descobertas
não podem ser removidas.

`/connections` apresenta as conexões ativas e o e-mail do outro participante.
Qualquer uma das partes pode remover uma conexão após confirmação; os dois
participantes perdem a XP concedida por ela, e o documento permanece armazenado
para preservar o histórico e permitir uma futura reconexão. A página possui
skeleton estrutural durante a consulta e erro recuperável para falhas de
carregamento.

`/missions` projeta a experiência conforme as permissões do perfil.
Participantes veem disponibilidade, pré-requisitos, conclusão e XP.
Reviewers/admins escolhem uma missão presencial e escaneiam o QR temporário do
participante. Cards bloqueados, disponíveis e concluídos usam tratamentos
visuais distintos; o estado disponível recebe somente borda, ícone e degradê
discreto no verde neon `#8BFF3D`, sem preencher todo o card. Bloqueios
apresentam nominalmente as visitas ou missões pendentes. Missões presenciais
disponíveis oferecem um atalho para o QR do participante, preservando
`/missions` como destino de retorno.

`/passport` agrega empresas visitadas, Tags descobertas e missões concluídas.
O cabeçalho apresenta progresso geral e XP registrado nessas atividades; o
resumo separa os totais por categoria e as últimas conquistas são ordenadas
pela data real de conclusão. As abas exibem carimbos de empresas, slots de Tags
e o estado das missões sem revelar Tags bloqueadas. Empresas visitadas recebem
borda, brilho e um selo visual com ícone de carimbo; as pendentes permanecem em
escala de cinza e com menor contraste. A página é somente leitura e fica
disponível exclusivamente para contas com papel `participant`. Os cards do
resumo ativam a aba relacionada e navegam até a seção de coleções; a seleção
permanece no parâmetro `collection` após refresh. A rolagem usa transição suave
quando o dispositivo não solicita redução de movimento.

`/ranking` apresenta o nível, XP, progresso total até os 4.000 XP do nível
máximo e posição do participante. O indicador funciona como um termômetro da
jornada completa, acompanhado pelos valores atual e máximo. Quem
está no Top 3 vê as dez primeiras posições; os demais veem o Top 3 e uma
janela contextual com até três posições acima e três abaixo da própria
colocação. Ouro, prata e bronze
diferenciam o pódio, enquanto a linha do participante usa marcador, borda e
fundo próprios. A projeção pública contém apenas nome, avatar, XP, nível e
posição. Contas sem papel `participant` recebem um estado informativo. Durante
o MVP, a classificação pode levar até 60 segundos para refletir uma mudança de
XP por causa do cache compartilhado do servidor.

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
- permita avaliar palestra somente depois do horário de encerramento configurado;
- após mutações, atualize a interface e revalide os dados relacionados.

## Próximo documento

➡️ [Navegação](./04-navigation.md)
