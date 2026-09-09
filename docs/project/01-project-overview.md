# Visão geral do projeto

O DevFest Triângulo Pokedex é uma aplicação mobile first para apoiar networking, participação em palestras e interação com patrocinadores durante o evento. A experiência utiliza QR Codes e gamificação, sem substituir a interação presencial. Cada implantação atende uma edição do DevFest Triângulo, mas a base deve ser reutilizável em edições futuras.

A referência de capacidade é de aproximadamente 2.000 pessoas, 10 a 20 empresas e pico entre 800 e 1.000 acessos simultâneos.

## Objetivos

- facilitar conexões entre participantes;
- incentivar visitas a patrocinadores, descoberta de tags e participação em atividades;
- registrar missões, presença e avaliações;
- distribuir pontos, níveis e tickets de sorteio com regras verificáveis;
- fornecer métricas agregadas à organização.

## Públicos

- **Participantes:** criam perfil, compartilham contato, cumprem missões e acompanham progresso.
- **Patrocinadores:** apresentam suas empresas e registram visitas por QR Code.
- **Palestrantes:** divulgam palestras e recebem avaliações.
- **Organização:** configura o evento pelo painel externo, revisa missões e acompanha métricas.

## Fluxo principal

```text
Login com Google → perfil/onboarding → home → ação ou leitura de QR Code
→ validação no servidor → atualização de progresso → feedback ao participante
```

## Escopo do MVP

- autenticação com Google;
- perfil e onboarding;
- home e navegação mobile;
- QR Code do participante e scanner;
- networking;
- empresas, tags, missões e passaporte;
- palestras e avaliações;
- ranking, níveis e tickets para sorteios;
- validação de operações críticas no servidor.

O painel administrativo já existe em outro projeto e não faz parte do escopo deste repositório.

## Fora do escopo inicial

- login por senha;
- chat em tempo real;
- pagamentos;
- scans ou operações críticas sem conexão;
- suporte simultâneo a múltiplos eventos na interface.

## Princípios

- experiência simples, acessível e otimizada para celular;
- gamificação vinculada a ações úteis;
- respostas rápidas e retry seguro em conexão instável, reconhecendo que scans exigem conectividade;
- privacidade e menor exposição possível de dados;
- regras de pontuação e tickets executadas no servidor.

## Indicadores de sucesso

- participantes com onboarding concluído;
- conexões, visitas, missões e avaliações registradas;
- uso do scanner e conclusão do passaporte;
- ticket inicial concedido uma única vez e conversões de cada 200 XP sem duplicidade;
- ausência de alterações indevidas de pontuação.

## Próximo documento

➡️ [Stack](./02-stack.md)
