# ADR 041 — Solicitação de participação ministerial

- Estado: aceita
- Data: 2026-08-07
- Complementa: [ADR 039](039-create-ministry-vertical-slice.md) e [ADR 040](040-define-ministry-role-vertical-slice.md)

## Contexto

Member e Ministry possuem ciclos independentes. O domínio exige aprovação para entrada no ministério e precisa preservar solicitações rejeitadas ou encerradas sem incorporar coleções de vínculos em nenhuma das duas roots.

## Decisão

`MinistryMembership` é um Aggregate Root separado identificado por `MinistryMembershipId`. `RequestMinistryMembership` cria o vínculo no estado `requested`, referenciando `OrganizationId`, `MinistryId` e `MemberId`.

Uma solicitação exige Member e Ministry ativos na mesma Organization. Apenas um vínculo vigente, nos estados `requested` ou `active`, pode existir para o par Ministry e Member. A Application obtém fatos mínimos por Reader e uma Policy pura decide; PostgreSQL protege a mesma unicidade sob concorrência com índice parcial.

A criação registra `MinistryMembershipRequested` e persiste Aggregate e outbox atomicamente. O mapper externo produz `ministry_membership.requested` versão 1 no canal `servir.ministries.events`, particionado por Organization. O endpoint é `POST /organizations/{organizationId}/ministries/{ministryId}/memberships` com `memberId` no corpo. Migrations permanecem no Liquibase.

## Consequências

Member e Ministry não carregam coleções de participação. Rejeição e encerramento futuros poderão liberar nova solicitação sem apagar histórico. Aprovação, rejeição, suspensão, reativação e qualificação não pertencem a este corte.

## Alternativas

Manter o vínculo dentro de Member ou Ministry foi rejeitado por unir ciclos independentes. Usar um endpoint `membership-requests` foi rejeitado porque a solicitação já cria o recurso durável que mudará de estado. Validar unicidade somente pelo Reader foi rejeitado por permitir corrida.
