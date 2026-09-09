# Componentes

## Organização

```text
components/
├── ui/          # primitivas Shadcn customizadas
├── layout/      # estrutura global da aplicação
└── shared/      # componentes reutilizados entre domínios
```

Componentes específicos de uma funcionalidade ficam no módulo correspondente. Promova-os para `shared` somente quando houver reutilização real.

## Componentes estruturais

| Componente         | Responsabilidade                            |
| ------------------ | ------------------------------------------- |
| `AppShell`         | largura mobile, safe areas e regiões fixas  |
| `AppHeader`        | saudação/título, voltar e ações contextuais |
| `BottomNavigation` | destinos principais e estado ativo          |
| `OnboardingLayout` | progresso e composição das etapas iniciais  |

## Componentes de domínio

| Domínio    | Componentes principais                        |
| ---------- | --------------------------------------------- |
| Perfil     | `ProfileCard`, `ProfileForm`, `SkillSelector` |
| QR Code    | `QrCodeCard`, `QrScanner`                     |
| Empresas   | `CompanyCard`, `CompanyBadge`                 |
| Missões    | `MissionCard`, `MissionProgress`              |
| Passaporte | `PassportProgress`, `PassportStamp`           |
| Ranking    | `RankingCard`, `CurrentRanking`               |
| Sorteios   | `TicketCard`                                  |

Esses nomes representam responsabilidades previstas, não obrigação de criar um arquivo antes de existir necessidade.

O `SkillSelector` pesquisa o catálogo estático pelo nome ou por aliases, persiste o slug selecionado e apresenta as escolhas como tags removíveis. O seletor impede duplicatas e limita a seleção a cinco habilidades; o formulário exige pelo menos três.

## Regras

- prefira componentes pequenos, nomeados e com props tipadas;
- componentes visuais recebem dados e callbacks; regras ficam nos módulos;
- não acesse Firestore ou segredos em componentes;
- não duplique variantes que podem ser resolvidas na primitiva de UI;
- use composição para conteúdo variável;
- mantenha a fronteira de Client Component tão pequena quanto possível.

## Estados obrigatórios

Telas e componentes de dados devem considerar:

- loading;
- vazio;
- erro recuperável;
- sucesso ou confirmação;
- disabled e ação em andamento.

## Catálogo de desenvolvimento

A rota temporária `/design-system` reuniu tokens, temas e estados dos
componentes para inspeção durante o desenvolvimento. Ela foi removida durante o
polimento do MVP; os padrões permanentes permanecem documentados neste diretório.

## Checklist

- [ ] Responsabilidade única e nome claro.
- [ ] Props estritamente tipadas.
- [ ] Estados e acessibilidade tratados.
- [ ] Tokens do Design System utilizados.
- [ ] Sem regra de negócio ou acesso direto a dados.

## Próximo documento

➡️ [Páginas](./03-pages.md)

## Confete de conquistas

`AchievementConfetti` carrega `canvas-confetti` sob demanda e desenha uma
explosão curta de partículas quadradas nas cores do aplicativo em um canvas
restrito ao card. O canvas é decorativo e não intercepta cliques. A animação
respeita movimento reduzido e é encerrada ao sair do componente.

Novas visitas, tags, missões e conexões disparam o efeito; registros já
existentes e erros não disparam. O banner de coleção completa do Passaporte
reutiliza o mesmo efeito e mantém sua regra de exibição única por conquista
recente no navegador. O efeito não altera pontuação ou concessões.
