# ADR 047 — Primeiro corte vertical de MinistryTeam

- Estado: aceita
- Data: 2026-08-10
- Complementa: [ADR 039](039-create-ministry-vertical-slice.md) e [ADR 046](046-organization-tenant-boundaries.md)

## Contexto

O domínio exige unidades operacionais dentro de Ministry para participação regular, liderança, templates e responsabilidade futura por escalas. Implementar todos esses comportamentos juntos ampliaria o corte antes de estabilizar a identidade e o ciclo do time.

## Decisão

`MinistryTeam` é Aggregate Root separado de Ministry, identificado por `MinistryTeamId` e inicialmente composto por `OrganizationId`, `MinistryId`, nome e estado ativo. `CreateMinistryTeam` exige Ministry ativo no mesmo tenant e nome ativo único dentro dele. PostgreSQL reforça pertencimento com FK composta e unicidade com índice parcial.

A criação persiste Aggregate e outbox atomicamente. `MinistryTeamCreated` é traduzido para `servir.ministries.ministry-team.created.v1`, no canal `servir.ministries.events`, particionado por Organization. O endpoint é `POST /organizations/{organizationId}/ministries/{ministryId}/teams`.

## Consequências

Ministry não carrega uma coleção que crescerá e mudará em ciclo independente. TeamMembership, liderança, templates e escalas podem evoluir sem aumentar a fronteira de consistência de Ministry. Participação e liderança permanecem fora deste corte.

## Alternativas

Modelar MinistryTeam como Entity interna de Ministry foi rejeitado porque participação, liderança e escalas possuem operações e crescimento independentes. Criar participação e liderança junto com o time foi rejeitado por misturar invariantes ainda sem casos de uso estabilizados.
