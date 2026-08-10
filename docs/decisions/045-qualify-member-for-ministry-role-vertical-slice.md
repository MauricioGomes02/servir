# ADR 045 — Qualificação de membro para função ministerial

- Estado: aceita
- Data: 2026-08-07
- Complementa: [ADR 043](043-approve-ministry-membership-vertical-slice.md) e [ADR 044](044-module-owned-persistence-registration.md)

## Contexto

Um vínculo ativo comprova participação no ministério, mas não quais funções o membro está apto a exercer. Essa aptidão precisa ter identidade e histórico próprios sem transformar `MinistryRole` em Aggregate Root nem criar persistência independente do vínculo.

## Decisão

`MinistryRoleQualification` é Entity interna de `MinistryMembership`, com ID tipado, `MinistryRoleId`, estado e `qualifiedAt`. `QualifyMemberForMinistryRole` aceita apenas vínculo ativo e função ativa do mesmo Ministry. Só pode existir uma qualificação ativa por vínculo e função; a Policy consulta os fatos da função e o Aggregate repete as invariantes que controla.

A qualificação é salva pelo Repository de `MinistryMembership`, sem Repository próprio, na mesma Unit of Work da outbox. O PostgreSQL reforça a unicidade com índice parcial. O evento de domínio `member.qualified_for_ministry_role` é publicado como `servir.ministries.member.qualified-for-ministry-role.v1` no canal `servir.ministries.events`.

O endpoint é `POST /organizations/{organizationId}/ministries/{ministryId}/memberships/{membershipId}/role-qualifications`, recebe `ministryRoleId` e responde `201` com a qualificação ativa.

## Consequências

A identidade própria permite revogação e nova qualificação futuras sem apagar histórico. Níveis, treinamentos, validade e revogação permanecem fora deste corte. A leitura da função participa da transação, e a restrição do banco protege concorrência além das verificações de domínio.

## Alternativas

Uma coleção de IDs sem Entity foi rejeitada por não suportar histórico. Um Aggregate Root e Repository exclusivos foram rejeitados por ampliar fronteiras e boilerplate sem uma necessidade de consistência independente. Colocar qualificações em Member ou Ministry foi rejeitado por misturar o vínculo contextual com outros Aggregates.
