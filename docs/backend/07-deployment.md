# Deployment

A aplicação é hospedada na Vercel e utiliza Auth.js com Google OAuth, Cloud Firestore e Firebase Storage.

## Ambientes

Development, staging e production devem possuir configurações e, preferencialmente, projetos Firebase isolados. Credenciais de produção não são usadas localmente.

Variáveis são configuradas na plataforma e documentadas sem valores em `.env.example`. Segredos e chaves privadas nunca são versionados.

## Fluxo

```text
feature branch → Pull Request → validações → merge em main
→ deploy automático → smoke test
```

Antes do deploy:

- `pnpm check` e `pnpm build` aprovados;
- variáveis do ambiente configuradas;
- regras e índices do Firestore revisados/publicados;
- migrations ou scripts de dados testados e reversíveis;
- documentação atualizada;
- nenhuma credencial presente no repositório.

Depois do encerramento e da conferência dos sorteios, simulações arquivadas
podem ser removidas por uma rotina administrativa de exclusão recursiva.
Preserve os registros durante o evento; nunca apague somente o documento pai de
`raffleTestRuns`, pois as subcoleções continuariam armazenadas.

## Publicação segura

- publique regras e índices na ordem compatível com o código;
- não faça alterações manuais irreprodutíveis em produção;
- use transações em mudanças concorrentes;
- realize smoke test de login, leitura principal e operação crítica após o deploy;
- registre versão, horário e responsável quando o processo não for totalmente automatizado.

## Monitoramento

Monitore erros de servidor e cliente, falhas de autenticação, latência, leituras/escritas do Firestore e operações críticas como scans, conexões e tickets. Logs não devem conter tokens, credenciais ou dados pessoais desnecessários.

## Rollback

Uma versão deve poder voltar sem corromper dados. Antes de mudanças incompatíveis, defina estratégia de compatibilidade e recuperação. Em incidente:

1. interrompa ou reverta o deploy;
2. preserve evidências sem expor dados sensíveis;
3. valide integridade dos dados;
4. execute smoke tests após a recuperação;
5. documente causa e prevenção.

## Índice da documentação

➡️ [Voltar ao índice](../README.md)
