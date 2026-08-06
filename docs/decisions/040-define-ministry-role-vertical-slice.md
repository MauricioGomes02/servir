# ADR 040 — Definição de funções ministeriais

- Estado: aceita
- Data: 2026-08-06
- Complementa: [ADR 039](039-create-ministry-vertical-slice.md)

## Contexto

Ministry foi estabelecido como Aggregate Root separado, mas ainda não possuía o catálogo de funções usado futuramente por qualificações, necessidades e atribuições de escala. Essas funções pertencem ao ciclo e às invariantes do ministério e não representam permissões técnicas de acesso.

## Decisão

`MinistryRole` é uma Entity interna de `Ministry`, com `MinistryRoleId`, nome e estado. `DefineMinistryRole` cria a função ativa por meio de `Ministry.defineRole`; não existe Repository próprio para a entidade interna.

O `MinistryRepository` distingue `add` de `save`. `add` pertence ao fluxo `CreateMinistry` e introduz uma root nova, rejeitando colisões; `save` pertence a `DefineMinistryRole` e persiste mudanças de uma root previamente obtida por `findById`. Os nomes expressam o ciclo esperado do Aggregate, não comandos SQL, e evitam um upsert que pudesse converter criação em alteração silenciosa.

O nome ativo é único dentro do Ministry, ignorando caixa e preservando acentos. O Aggregate protege a decisão em memória e PostgreSQL protege concorrência por índice único parcial. A operação carrega o Ministry pela combinação de `OrganizationId` e `MinistryId`, persiste a mudança e a outbox na mesma Unit of Work e registra `MinistryRoleDefined`.

O contrato público `ministry.role-defined.v1` usa `servir.ministries.events`, `OrganizationId` como chave de partição e o endpoint `POST /organizations/{organizationId}/ministries/{ministryId}/roles`.

## Consequências

Qualificações e escalas podem referenciar uma identidade estável sem copiar nomes. Funções desativadas poderão permanecer referenciáveis pelo histórico, mas desativação e reativação não pertencem a este corte. Uma função não pode ser persistida ou alterada fora da root.

## Alternativas

Um Repository próprio para MinistryRole foi rejeitado por atravessar a fronteira do Aggregate. Representar funções como strings foi rejeitado por perder identidade e histórico. Validar unicidade apenas no Aggregate foi rejeitado por não proteger carregamentos concorrentes.
