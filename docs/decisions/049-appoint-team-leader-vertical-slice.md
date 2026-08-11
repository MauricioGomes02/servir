# ADR 049 — Nomeação de líder de time ministerial

- Estado: aceita
- Data: 2026-08-11
- Complementa: [ADR 047](047-create-ministry-team-vertical-slice.md) e [ADR 048](048-assign-member-to-team-vertical-slice.md)

## Contexto

Cada time ministerial precisa de uma liderança vigente. A liderança deve preservar histórico, mas não deve fazer `MinistryTeam` carregar participantes ou períodos crescentes.

## Decisão

`TeamLeadership` é um Aggregate Root histórico separado. `AppointTeamLeader` cria a primeira liderança ativa de um time e exige uma `TeamMembership` ativa no mesmo Organization, Ministry e MinistryTeam. Inicialmente existe exatamente uma liderança vigente por time.

Estado e outbox são persistidos atomicamente. `TeamLeaderAppointed` produz `servir.ministries.team-leader.appointed.v1` no canal ministerial. O endpoint é `POST /organizations/{organizationId}/ministries/{ministryId}/teams/{teamId}/leadership`.

## Consequências

O time permanece uma root pequena e a liderança pode evoluir historicamente. Encerramento, substituição e liderança colegiada permanecem fora deste corte e exigirão decisões explícitas.

## Alternativas

Guardar o líder diretamente em `MinistryTeam` foi rejeitado porque substituições exigiriam histórico adicional dentro da root. Permitir vários líderes vigentes foi adiado porque o domínio ainda não demonstrou colegiado e isso tornaria responsabilidade e autorização futuras ambíguas.
