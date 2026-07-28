# Design System

O Design System prioriza uso em celulares, acessibilidade e consistência. Tokens são a fonte de verdade. A estrutura do Tailwind e do Shadcn deve ser preservada; a personalização concentra-se em cores, tipografia, sombras, gradientes, assets e estilos dos componentes.

## Direção visual

- tema híbrido determinado pela rota, sem seletor para o participante;
- login, onboarding e scanner usam o tema dark;
- conteúdo, formulários, listas e ranking usam o tema light;
- o Android é o mascote permanente do evento;
- Halloween é o tema exclusivo da edição atual;
- cores e assets temáticos devem poder mudar entre edições sem alterar a estrutura dos componentes.

## Layout

- conteúdo centralizado com largura máxima aproximada de `430px`;
- fundo externo com gradiente coerente com o tema light ou dark da rota;
- altura baseada em `100dvh` e suporte a safe areas;
- header e navegação inferior fixos quando aplicável;
- scroll restrito à área principal;
- espaçamento mínimo lateral consistente;
- expansão progressiva para telas maiores sem perder o foco mobile.

A largura de `430px` é um limite máximo, não uma largura fixa. Em telas menores, o shell ocupa `100%` da largura disponível.

## Cores

| Papel        | Base      | Estado ativo |
| ------------ | --------- | ------------ |
| Primary      | `#7C3AED` | `#6D28D9`    |
| Secondary    | `#F6F118` | `#DCD80E`    |
| Info         | `#06B6D4` | `#0891B2`    |
| Gamification | `#F97316` | `#EA580C`    |
| Success      | `#22C55E` | —            |
| Destructive  | `#EF4444` | —            |

O amarelo ácido da cor secundária reforça a direção gamer e Halloween da edição e identifica ações complementares. Em superfícies claras, o foco usa o roxo primário para manter contraste; em superfícies escuras, pode usar o amarelo ácido. O laranja é exclusivo de XP, níveis, ranking, tickets e recompensas. O ciano permanece restrito a informação e scanner, sem compor a identidade principal.

Superfícies light:

```text
background: #F8FAFC
surface: #FFFFFF
border: #E2E8F0
foreground: #020617
muted foreground: #475569
```

Superfícies dark:

```text
background: #020617
surface: #0F172A
border/surface elevated: #1E293B
foreground: #F8FAFC
```

Componentes devem consumir tokens, evitando cores HEX, medidas e sombras arbitrárias. Cores precisam manter contraste adequado em estados normal, hover, focus e disabled.

## Gradientes, sombras e transparência

```text
Primary: 135deg, #7C3AED → #F6F118
Gamification: 90deg, #F97316 → #FB923C
Immersive: 180deg, #020617 → #2E1065
```

- ações de progressão usam gradiente primary apenas no dark;
- ações principais no light usam roxo sólido;
- cards light usam sombras discretas;
- transparência e glass effect são exclusivos das telas dark;
- glow roxo ou ciano é reservado a scanner, QR Code e conquistas;
- glow laranja é reservado a elementos de gamificação.

## Tipografia

| Estilo     | Tamanho | Peso | Uso                 |
| ---------- | ------- | ---- | ------------------- |
| Display    | 32px    | 700  | títulos de destaque |
| H1         | 24px    | 700  | título da página    |
| H2         | 20px    | 600  | seção               |
| H3         | 16px    | 600  | card e destaque     |
| Body large | 16px    | 400  | texto principal     |
| Body       | 14px    | 400  | texto padrão        |
| Small      | 12px    | 400  | legenda e apoio     |
| Tiny       | 10px    | 500  | informação compacta |

- Geist Sans: interface e textos;
- Geist Mono: IDs de QR Code e dados técnicos;
- Geist Pixel Square: XP, níveis, ranking, tickets e celebrações;
- a fonte pixel não deve ser usada em parágrafos, formulários ou listas longas.

## Ícones e assets

- use Lucide React com traço padrão e tamanho consistente;
- ilustrações 3D ficam restritas aos assets temáticos;
- assets podem usar recorte responsivo, `object-fit`, overlays e gradientes CSS;
- arquivos originais não devem ser editados para adaptação de layout;
- assets da edição atual ficam em `public/images/assets`;
- ícones decorativos devem ser ocultos de tecnologias assistivas; ícones funcionais precisam de nome acessível.

## Componentes

As primitivas principais são Button, Card, Badge, Avatar, Progress, Input, Textarea, Select, Dialog/Drawer, Tabs, Skeleton e Toast. Customize componentes Shadcn em `components/ui` e reutilize-os antes de criar novas primitivas.

- botões e inputs usam radius de 12px;
- cards e modais usam radius de 16px;
- chips e badges usam formato cápsula;
- cards são sólidos no light;
- cards podem ser translúcidos somente no dark.

Escala de altura para controles:

| Tamanho   | Altura | Uso                                |
| --------- | ------ | ---------------------------------- |
| `xs`      | 32px   | ações compactas e auxiliares       |
| `sm`      | 36px   | controles secundários              |
| `default` | 40px   | botões, inputs e selects padrão    |
| `lg`      | 44px   | ações principais de maior destaque |

Variantes de ícone seguem as mesmas dimensões. Controles `xs` e `sm` devem ser usados apenas quando a área clicável ou o contexto preserve usabilidade adequada.

Todos os componentes interativos devem oferecer:

- foco visível;
- área de toque confortável;
- estados default, hover, active, disabled e loading;
- rótulo ou nome acessível;
- feedback sem depender apenas de cor.

## Movimento e feedback

- animações devem ser curtas e comunicar mudança de estado;
- respeite `prefers-reduced-motion`;
- use skeleton para carregamento estrutural e spinner para ações curtas;
- mensagens devem explicar erro e próxima ação;
- estados vazios devem orientar o usuário.

## Checklist

- [ ] Usa tokens semânticos.
- [ ] Funciona entre telas pequenas e `430px`.
- [ ] Possui foco, contraste e área de toque adequados.
- [ ] Trata loading, vazio, erro, sucesso e disabled.
- [ ] Não depende somente de cor ou animação.

## Próximo documento

➡️ [Componentes](./02-components.md)
