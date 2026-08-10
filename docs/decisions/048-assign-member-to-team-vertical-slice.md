# ADR 048 — Participação de membro em time ministerial

- Estado: aceita
- Data: 2026-08-10
- Complementa: [ADR 041](041-request-ministry-membership-vertical-slice.md), [ADR 046](046-organization-tenant-boundaries.md) e [ADR 047](047-create-ministry-team-vertical-slice.md)

## Contexto

Um vínculo ministerial ativo permite participação no Ministry, mas não identifica o time operacional regular do membro. Essa participação precisa preservar vigência e histórico sem fazer MinistryTeam carregar uma coleção crescente.

## Decisão

`TeamMembership` é Aggregate Root histórico separado. `AssignMemberToTeam` cria o vínculo ativo entre `MinistryMembership` e `MinistryTeam`, exigindo ambos ativos no mesmo Organization e Ministry. Só existe uma participação ativa por time e vínculo ministerial; um membro pode participar de vários times. Qualificação de função não é exigida para entrar no time e continua sendo validada na atribuição de escala.

Estado e outbox são persistidos atomicamente. O evento `MemberAssignedToTeam` produz `servir.ministries.member.assigned-to-team.v1` no canal ministerial. O endpoint é `POST /organizations/{organizationId}/ministries/{ministryId}/teams/{teamId}/memberships`.

## Consequências

Participação pode ser encerrada e recriada futuramente sem perder histórico. FKs compostas impedem relações entre tenants ou Ministries. Liderança e participação de apoio permanecem fora deste corte.

## Alternativas

Manter participantes dentro de MinistryTeam foi rejeitado por crescimento e contenção da root. Exigir qualificação durante a entrada foi rejeitado porque participar do time e exercer uma função específica são decisões diferentes.
