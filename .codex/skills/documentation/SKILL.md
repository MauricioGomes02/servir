---
name: documentation
description: Criar e manter documentação arquitetural do Servir. Usar ao introduzir ou alterar primitivas, vocabulário, decisões, relações, roadmap, diagramas Mermaid, exemplos ou estrutura navegável da wiki.
---

# Objetivo

Manter documentação e código como duas expressões coerentes do mesmo contrato.

## Quando utilizar

Usar em toda mudança semântica, nova primitiva ou decisão transversal.

## Regras obrigatórias

1. Ler `../../../README.md`, `../../../docs/glossary.md` e `../../../docs/roadmap.md`.
2. Manter README como índice e detalhes em `docs/`.
3. Para primitivas, cobrir motivação, problema, responsabilidades, limites, fluxo, exemplos, relações, evolução, boas práticas e anti-patterns.
4. Criar Mermaid somente quando esclarecer relação ou sequência.
5. Registrar decisão duradoura em ADR; não reescrever ADR aceito.
6. Validar links relativos e distinguir estado planejado de implementado.

## Exemplo correto

Uma nova primitiva atualiza seu documento, índice, glossário, roadmap, diagrama e skill relacionada.

## Anti-patterns

- README monolítico.
- Exemplo apresentado como API implementada.
- Documentação copiada e divergente em vários locais.

## Checklist

- [ ] Links e índice funcionam?
- [ ] O “porquê” está explícito?
- [ ] Limites e anti-exemplos estão claros?
- [ ] Estado real está correto?
- [ ] ADR e glossário foram avaliados?
