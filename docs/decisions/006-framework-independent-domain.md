# ADR 006 — Domínio independente de framework

- Estado: aceita
- Data: 2026-07-24

## Contexto

Frameworks, transports e persistência mudam em ritmos diferentes das regras.

## Decisão

O domínio não importa ORM, HTTP, broker, container, SDK cloud ou decorators de framework. Integrações implementam ports em adapters.

## Consequências

O núcleo pode ser testado e reutilizado isoladamente. Traduções e wiring permanecem necessários nas bordas.

## Alternativas

Active Record e decorators de persistência no domínio foram rejeitados por vazamento tecnológico.
