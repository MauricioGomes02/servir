# Servir

## Escopo

Servir é uma plataforma de gestão ministerial com domínio rico, consistência transacional e arquitetura orientada a eventos.

- `backend/`: API, relay de outbox e pacotes compartilhados Node.
- `frontend/`: aplicação web Vue e BFF.
- `infrastructure/`: Terraform, containers, observabilidade e migrations operacionais.
- `docs/`: arquitetura, domínio, primitivas, ADRs e estratégias.
- `.codex/skills/`: conhecimento especializado acionado por domínio.

## Regras de trabalho

- Comece pelo diretório diretamente relacionado à tarefa e amplie a investigação somente seguindo referências necessárias.
- Preserve alterações existentes e limite o diff ao escopo solicitado.
- Mantenha o domínio independente de HTTP, banco, broker e frameworks; efeitos ficam em ports e adapters.
- Commands alteram Aggregates por contratos da Application; Queries usam Readers e Read Models orientados ao consumidor.
- Registre eventos no Aggregate e publique-os fora do domínio. Não transforme eventos internos automaticamente em contratos de integração.
- Consulte `docs/architecture.md`, `docs/glossary.md` e o ADR relacionado antes de mudanças arquiteturais.
- Use `docs/decisions/` para registrar o porquê de decisões duradouras; não copie sua motivação para instruções operacionais.

## Skills e documentação

- Use somente a skill especializada exigida pela tarefa. O contrato da skill está em `.codex/skills/<nome>/SKILL.md`.
- `.codex/skills/<nome>/agents/openai.yaml` contém apenas metadados da interface; regras de trabalho pertencem ao `SKILL.md`.
- Não replique regras do `AGENTS.md` nas skills, nem mova documentação detalhada para instruções permanentes.
- Para organizar uma tarefa, escolher modelo ou validar uma mudança feita pelo Codex, consulte `docs/codex.md`.
- Use a documentação de produto e arquitetura como fonte de conhecimento; mantenha descobertas temporárias na conversa.

## Validação

Execute os checks do workspace afetado:

```bash
cd backend && npm run check
cd frontend && npm run check
```

Para mudanças de infraestrutura, siga `infrastructure/README.md` e execute `terraform fmt -check -recursive` e `terraform validate` no ambiente Terraform afetado. Integrações PostgreSQL são explícitas e exigem `TEST_DATABASE_URL`.

Antes de concluir, execute os testes relevantes, revise `git diff` e `git diff --check`, confirme que os arquivos alterados pertencem ao escopo e verifique links ou referências adicionados.
