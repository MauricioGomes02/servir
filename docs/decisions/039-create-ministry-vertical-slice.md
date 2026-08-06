# ADR 039 — Primeiro corte vertical de Ministry

- Estado: aceita
- Data: 2026-08-06
- Complementa: [ADR 002](002-event-driven.md), [ADR 021](021-postgresql-transactional-unit-of-work.md), [ADR 029](029-command-query-responsibility-separation.md) e [ADR 030](030-message-owned-publication-routing.md)

## Contexto

O domínio ministerial identificou Ministry e MinistryRole, mas ainda não havia estabilizado a fronteira do Aggregate nem o primeiro caso de uso. Colocar ministérios dentro de Organization faria a root crescer com ciclos e invariantes independentes. Introduzir funções no mesmo incremento também anteciparia regras de identidade, desativação e unicidade ainda sem consumidor executável.

## Decisão

Ministry é um Aggregate Root separado de Organization. O primeiro corte implementa `CreateMinistry`; a root nasce com `MinistryId`, `OrganizationId`, nome e estado ativo. `MinistryRole` será introduzida posteriormente por `DefineMinistryRole`.

Um nome ativo é único dentro da organização, ignorando diferenças entre maiúsculas e minúsculas e preservando acentos. A Application obtém fatos mínimos para uma Policy explícita; PostgreSQL também protege concorrência por índice único parcial. Conflitos são falhas esperadas e não produzem outbox.

A criação registra `MinistryCreated` e persiste Aggregate e outbox na mesma Unit of Work. O mapper externo produz `ministry.created.v1`, roteado para `servir.ministries.events`, com `OrganizationId` como chave de partição. O endpoint é `POST /organizations/{organizationId}/ministries`. Migrations permanecem em changesets Liquibase externos à aplicação.

## Consequências

Organization não carrega coleções ministeriais e Ministry pode evoluir seu próprio ciclo. A unicidade permanece correta sob concorrência, inclusive quando duas requisições passam pela leitura antecipada. Uma organização inexistente, nome inválido ou conflito são apresentados como falhas esperadas; falhas técnicas continuam excepcionais.

O primeiro contrato não inclui funções, times ou `createdAt` no estado da root. O instante do fato permanece em `MinistryCreated`. Reativação e reutilização de nomes inativos exigirão casos de uso futuros compatíveis com o índice parcial.

## Alternativas

Manter Ministry dentro de Organization foi rejeitado por unir ciclos e invariantes independentes. Criar MinistryRole junto do primeiro corte foi rejeitado por ampliar o escopo antes de `DefineMinistryRole`. Validar unicidade somente por Reader foi rejeitado por permitir corrida. Tratar violação do índice como falha técnica foi rejeitado porque duplicidade é uma condição esperada do negócio.
