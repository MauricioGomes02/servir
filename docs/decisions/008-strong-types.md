# ADR 008 — Tipos fortes e nominais

- Estado: aceita
- Data: 2026-07-24

## Contexto

TypeScript possui tipagem estrutural, portanto strings semanticamente diferentes podem ser trocadas acidentalmente.

## Decisão

Usar unions discriminadas, literais para códigos e branding/tipos dedicados para identidades e valores de domínio.

## Consequências

Erros são detectados mais cedo e contratos comunicam intenção. Casts e brands devem permanecer encapsulados em factories validadas.

## Alternativas

Primitivos crus e tipos genéricos onipresentes foram rejeitados por permitirem estados inválidos.
