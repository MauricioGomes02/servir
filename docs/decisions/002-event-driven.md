# ADR 002 — Comunicação por eventos

- Estado: aceita
- Data: 2026-07-24

## Contexto

Fatos de domínio podem interessar a vários consumidores que não devem ser conhecidos pelo produtor.

## Decisão

Aggregates registram Domain Events sem efeitos. A camada externa coleta e publica por um port; contratos de integração são traduções versionadas, não as classes internas.

## Consequências

Consumidores evoluem com menor acoplamento. Ordenação, entrega, transação e idempotência precisam ser explicitadas onde aplicáveis.

## Alternativas

Chamadas diretas e publicação em broker pelo domínio foram rejeitadas por misturar comportamento e infraestrutura.
