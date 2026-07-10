# Fluxo de desenvolvimento

## 1. Preparar

Antes de implementar:

1. selecione uma entrega do [roadmap](./06-roadmap.md);
2. leia os documentos de frontend e backend relacionados;
3. confirme dependências e critérios de aceite;
4. identifique módulo, schema, regras, componentes e rota envolvidos;
5. crie uma branch no formato `tipo/descricao-curta`.

Não inicie uma funcionalidade cuja dependência essencial ainda não exista.

## 2. Implementar

Trabalhe em alterações pequenas e coesas. O fluxo típico é:

```text
Schema → Service/Repository → Action ou Handler → Componente → Página
```

Durante o desenvolvimento:

- use Server Components por padrão;
- mantenha regras de negócio em `modules`;
- valide entradas externas com Zod;
- não acesse o Firestore em componentes;
- trate loading, vazio, erro e sucesso;
- não deixe `console.log`, código morto ou `any`.

## 3. Validar

Execute durante a implementação:

```bash
pnpm lint
pnpm typecheck
```

Antes de concluir:

```bash
pnpm check
pnpm build
```

Teste manualmente o fluxo principal, navegação mobile, persistência, mensagens de erro e permissões. Funcionalidades de câmera devem ser verificadas em dispositivo real quando possível.

## 4. Documentar

Atualize a documentação quando mudar:

- arquitetura ou schema;
- regra de negócio ou segurança;
- rota, contrato ou variável de ambiente;
- coleção ou consulta do Firestore;
- componente ou token do Design System;
- status de uma fase do roadmap.

Documente decisões duradouras, não detalhes que o código já explica.

## 5. Commit e revisão

Use Conventional Commits em inglês:

```text
feat(profile): add skill selector
fix(auth): prevent redirect loop
docs(qr-code): clarify validation flow
```

Cada commit deve ser coeso. Antes do merge, confirme revisão, critérios de aceite, documentação e validações automáticas.

Um Pull Request deve informar:

- objetivo e principais mudanças;
- passos de validação;
- evidências visuais quando aplicável;
- limitações conhecidas;
- documentos atualizados.

## Definition of Done

- [ ] Critérios de aceite atendidos.
- [ ] Fluxo principal e erros testados.
- [ ] Segurança e autorização revisadas.
- [ ] Código sem logs temporários ou tipos inseguros.
- [ ] Documentação atualizada.
- [ ] `pnpm check` e `pnpm build` aprovados.

## Próximo documento

➡️ [Design System](../frontend/01-design-system.md)
