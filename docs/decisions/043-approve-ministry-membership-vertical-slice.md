# ADR 043 — Aprovação de participação ministerial

- Estado: aceita
- Data: 2026-08-07
- Complementa: [ADR 041](041-request-ministry-membership-vertical-slice.md) e [ADR 042](042-typed-mediator-and-installable-modules.md)

## Contexto

`RequestMinistryMembership` cria um vínculo durável em `requested`, mas a linguagem do domínio exige aprovação antes da entrada efetiva no ministério. A aprovação precisa preservar o histórico do pedido, impedir transições repetidas e manter estado e contrato externo atomicamente consistentes.

## Decisão

`ApproveMinistryMembership` carrega a root pela organização, ministério e identidade do vínculo. Somente o estado `requested` transita para `active`; qualquer outro estado produz a falha esperada `ministry_membership.approval.not_requested`, sem mutação ou evento. A root preserva `requestedAt` e registra `approvedAt` com o mesmo `Instant` de `MinistryMembershipApproved`.

O Repository distingue `add`, usado na solicitação, de `findById` e `save`, usados na aprovação. Estado e outbox são persistidos na mesma Unit of Work. O mapper produz `ministry_membership.approved` versão 1 no canal `servir.ministries.events`, particionado por Organization.

O endpoint é `POST /organizations/{organizationId}/ministries/{ministryId}/memberships/{membershipId}/approval`, sem body, e responde com o vínculo ativo. Ator e autorização permanecem fora do Aggregate até Identity & Access fornecer identidade autenticada; qualificação para funções pertence ao próximo corte.

## Consequências

Um vínculo ativo comprova entrada aprovada no ministério sem incorporar coleções em Member ou Ministry. Repetir a aprovação retorna conflito em vez de esconder uma transição inválida como idempotência. Vínculo ausente ou fora da organização/ministério retorna ausência esperada.

PostgreSQL passa a persistir `approved_at`; o código de status ativo já fazia parte do schema. Rejeição, suspensão, reativação, encerramento e qualificação continuam planejados.

## Alternativas

Tratar aprovação como flag em Member ou Ministry foi rejeitado por atravessar a fronteira do Aggregate. Tornar a operação idempotente foi rejeitado porque ocultaria comandos repetidos e estados posteriores incompatíveis. Persistir apenas o instante do evento foi rejeitado porque obrigaria reconstrução do estado por histórico da outbox. Exigir `approvedBy` agora foi rejeitado por antecipar um contrato de identidade e autorização ainda inexistente.
