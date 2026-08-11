# ADR 052 — Primeiro corte vertical de Activity

- Estado: aceita
- Data: 2026-08-11
- Complementa: [ADR 046](046-organization-tenant-boundaries.md) e [ADR 051](051-civil-temporal-values.md)

## Contexto

O domínio distingue a atividade planejada de suas ocorrências concretas. Criar Activity e agendar sua primeira ocorrência no mesmo caso de uso uniria ciclos independentes e obrigaria o primeiro corte a resolver simultaneamente políticas de timezone e transições de offset.

## Decisão

`Activity` é Aggregate Root separado de Organization e de `ActivityOccurrence`. `CreateActivity` cria uma root ativa com identidade, Organization, nome e um conjunto não vazio de ministérios participantes ativos do mesmo tenant. IDs participantes não podem se repetir. O nome ativo é único por Organization, ignorando caixa e preservando acentos.

O endpoint é `POST /organizations/{organizationId}/activities`. Activity, vínculos participantes e outbox são persistidos atomicamente. O fato interno `ActivityCreated` é traduzido para `activity.created.v1` no canal `servir.activities.events`, particionado por Organization. O schema permanece governado pelo Liquibase.

## Consequências

A atividade pode receber várias ocorrências manuais sem reabrir sua criação. Constraints compostas impedem participantes de outro tenant e um índice parcial protege a unicidade sob concorrência. Criação não define recorrência, data, horário ou timezone. O próximo corte introduzirá `ActivityOccurrence` manual e decidirá explicitamente horários civis inexistentes ou ambíguos.

## Alternativas

Criar Activity e primeira ocorrência juntas foi rejeitado por acoplar ciclos e políticas temporais. Permitir Activity sem ministério foi rejeitado porque ela não teria responsável ministerial. Validar tenant e unicidade apenas em leitura foi rejeitado por não proteger concorrência nem referências cruzadas.
