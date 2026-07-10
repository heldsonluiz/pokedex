# Design System

O Design System prioriza uso em celulares, acessibilidade e consistência. Tokens são a fonte de verdade; valores específicos devem ser definidos na implementação, não duplicados neste documento.

## Layout

- conteúdo centralizado com largura máxima aproximada de `430px`;
- altura baseada em `100dvh` e suporte a safe areas;
- header e navegação inferior fixos quando aplicável;
- scroll restrito à área principal;
- espaçamento mínimo lateral consistente;
- expansão progressiva para telas maiores sem perder o foco mobile.

## Tokens

Defina tokens semânticos para:

- background, surface e border;
- primary, secondary e accent;
- foreground e muted foreground;
- success, warning, destructive e info;
- tipografia, espaçamento, radius, sombra e duração de animação.

Componentes devem consumir tokens, evitando cores HEX, medidas e sombras arbitrárias. Cores precisam manter contraste adequado em estados normal, hover, focus e disabled.

## Tipografia e ícones

- use uma fonte legível e poucos pesos;
- mantenha hierarquia clara entre título, subtítulo, corpo e legenda;
- preserve tamanho confortável para leitura em telas pequenas;
- use Lucide React com tamanho e espessura consistentes;
- ícones decorativos devem ser ocultos de tecnologias assistivas; ícones funcionais precisam de nome acessível.

## Componentes

As primitivas principais são Button, Card, Badge, Avatar, Progress, Input, Textarea, Select, Dialog/Drawer, Tabs, Skeleton e Toast. Customize componentes Shadcn em `components/ui` e reutilize-os antes de criar novas primitivas.

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
